import { NextResponse } from "next/server";
import { Resend } from "resend";
import { EXPERIENCE_META, formatDateLong } from "@/lib/booking-flow";
import {
  BookingPersistPayloadRaw,
  BookingPersistenceError,
  normalizeBookingPayload,
  persistBooking,
  setBookingMailStatus,
} from "@/lib/booking-persistence";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const VENUE_ADDRESS = [
  "69 Crowther Road",
  "Lower Hutt, Wellington 5373",
  "New Zealand",
].join(", ");

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const replyTo = process.env.RESEND_REPLY_TO;

  if (!apiKey || !from) {
    return null;
  }

  return {
    client: new Resend(apiKey),
    from,
    replyTo,
  };
}

function buildMailContent(normalized: ReturnType<typeof normalizeBookingPayload>) {
  const experience = EXPERIENCE_META[normalized.experienceKey];
  const dateText = formatDateLong(normalized.date);
  const timeText = normalized.timeRange;
  const totalPrice = experience.unitPrice * normalized.guests;
  const guestLabel = normalized.guests === 1 ? "Traveler" : "Travelers";

  const text = [
    "MOSO TEA BOOKING INFORMATION",
    "",
    `Booking Reference: ${normalized.bookingRef}`,
    `Experience: ${experience.title}`,
    `Date: ${dateText}`,
    `Time: ${timeText}`,
    `Guests: ${normalized.guests} ${guestLabel}`,
    `Total: $${totalPrice.toFixed(2)}`,
    "",
    "Contact Information",
    `Full Name: ${normalized.fullName}`,
    `Email: ${normalized.email}`,
    `Phone: ${normalized.phone}`,
    `Notes: ${normalized.notes.length > 0 ? normalized.notes : "N/A"}`,
    "",
    "Venue Address",
    "69 Crowther Road",
    "Lower Hutt, Wellington 5373",
    "New Zealand",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1c1c19; line-height: 1.6;">
      <h2 style="margin: 0 0 16px;">MOSO TEA BOOKING INFORMATION</h2>
      <p style="margin: 0 0 20px;"><strong>Booking Reference:</strong> ${normalized.bookingRef}</p>
      <table cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 640px;">
        <tr><td><strong>Experience</strong></td><td>${experience.title}</td></tr>
        <tr><td><strong>Date</strong></td><td>${dateText}</td></tr>
        <tr><td><strong>Time</strong></td><td>${timeText}</td></tr>
        <tr><td><strong>Guests</strong></td><td>${normalized.guests} ${guestLabel}</td></tr>
        <tr><td><strong>Total</strong></td><td>$${totalPrice.toFixed(2)}</td></tr>
      </table>
      <h3 style="margin: 24px 0 8px;">Contact Information</h3>
      <p style="margin: 0;">Full Name: ${normalized.fullName}</p>
      <p style="margin: 0;">Email: ${normalized.email}</p>
      <p style="margin: 0;">Phone: ${normalized.phone}</p>
      <p style="margin: 0;">Notes: ${normalized.notes.length > 0 ? normalized.notes : "N/A"}</p>
      <h3 style="margin: 24px 0 8px;">Venue Address</h3>
      <p style="margin: 0;">69 Crowther Road<br/>Lower Hutt, Wellington 5373<br/>New Zealand</p>
    </div>
  `;

  return { text, html, venueAddress: VENUE_ADDRESS };
}

export async function POST(request: Request) {
  let bookingRef = "";
  try {
    const resend = getResendConfig();
    if (!resend) {
      return NextResponse.json(
        { error: "Resend is not configured on server." },
        { status: 500 }
      );
    }

    const raw = (await request.json()) as BookingPersistPayloadRaw;
    const normalized = normalizeBookingPayload(raw);
    bookingRef = normalized.bookingRef;
    const client = getSupabaseAdminClient();
    const bookingResult = await persistBooking(client, normalized);
    await setBookingMailStatus(client, normalized.bookingRef, "pending");

    const content = buildMailContent(normalized);
    const { data, error } = await resend.client.emails.send({
      from: resend.from,
      to: [normalized.email],
      ...(resend.replyTo ? { replyTo: resend.replyTo } : {}),
      subject: "MOSO TEA BOOKING INFORMATION",
      text: content.text,
      html: content.html,
    });

    if (error) {
      await setBookingMailStatus(client, normalized.bookingRef, "failed");
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await setBookingMailStatus(client, normalized.bookingRef, "sent");

    return NextResponse.json({
      ok: true,
      bookingRef: normalized.bookingRef,
      bookingId: bookingResult.bookingId,
      sessionId: bookingResult.sessionId,
      created: bookingResult.created,
      messageId: data?.id ?? null,
      email: normalized.email,
      venueAddress: content.venueAddress,
    });
  } catch (error) {
    if (error instanceof BookingPersistenceError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          bookingRef: bookingRef || null,
        },
        { status: error.status }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
