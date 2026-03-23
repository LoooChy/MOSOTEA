import { NextResponse } from "next/server";
import { Resend } from "resend";
import { ensureAdminApiAuth } from "@/lib/admin-api-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const CANCELLATION_SUBJECT = "MOSO TEA BOOKING CANCELLATION NOTICE";

type SessionWorkshop = { title: string } | { title: string }[] | null;

type SessionRow = {
  id: string;
  capacity: number;
  booked_count: number;
  status: string;
  workshop_key: string;
  session_date: string;
  start_time: string;
  end_time: string;
  workshop_catalog: SessionWorkshop;
};

type BookingRecipientRow = {
  id: string;
  booking_ref: string;
  full_name: string;
  email: string;
  guests: number;
};

type UpdatePayload = {
  action?: "cancel" | "edit" | "complete";
  bookedCount?: number;
};

function clampBookedCount(raw: number): number {
  if (!Number.isFinite(raw)) {
    return 0;
  }
  return Math.max(0, Math.min(6, Math.floor(raw)));
}

function getSessionTitle(workshop: SessionWorkshop, fallback: string): string {
  if (!workshop) {
    return fallback;
  }
  if (Array.isArray(workshop)) {
    return workshop[0]?.title ?? fallback;
  }
  return workshop.title ?? fallback;
}

function formatDate(dateToken: string): string {
  const parsed = new Date(`${dateToken}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dateToken;
  }
  return new Intl.DateTimeFormat("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatTimeRange(start: string, end: string): string {
  return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
}

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

function buildCancellationMail(
  session: SessionRow,
  booking: BookingRecipientRow
): { text: string; html: string } {
  const sessionTitle = getSessionTitle(session.workshop_catalog, session.workshop_key);
  const sessionDate = formatDate(session.session_date);
  const timeRange = formatTimeRange(session.start_time, session.end_time);
  const guestLabel = booking.guests === 1 ? "guest" : "guests";

  const text = [
    CANCELLATION_SUBJECT,
    "",
    `Dear ${booking.full_name},`,
    "",
    "We are very sorry to inform you that this event has been cancelled, and we look forward to meeting you next time.",
    "",
    `Booking Reference: ${booking.booking_ref}`,
    `Experience: ${sessionTitle}`,
    `Date & Time: ${sessionDate} ${timeRange}`,
    `Guests: ${booking.guests} ${guestLabel}`,
    "",
    "If you have any questions, please contact:",
    "hello@mosotea.co.nz",
    "+64 27 489 2131",
  ].join("\n");

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #1c1c19; line-height: 1.65; max-width: 640px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 16px; font-size: 24px; letter-spacing: 0.04em;">${CANCELLATION_SUBJECT}</h2>
      <p style="margin: 0 0 14px;">Dear ${booking.full_name},</p>
      <p style="margin: 0 0 10px;">We are very sorry to inform you that this event has been cancelled, and we look forward to meeting you next time.</p>
      <p style="margin: 0 0 18px;">非常遗憾地通知您，本次活动已取消，期待我们下次相遇。</p>
      <div style="border: 1px solid #d9d6cf; border-radius: 12px; padding: 14px 16px; background: #f9f7f3; margin: 0 0 18px;">
        <p style="margin: 0 0 6px;"><strong>Booking Reference:</strong> ${booking.booking_ref}</p>
        <p style="margin: 0 0 6px;"><strong>Experience:</strong> ${sessionTitle}</p>
        <p style="margin: 0 0 6px;"><strong>Date &amp; Time:</strong> ${sessionDate} ${timeRange}</p>
        <p style="margin: 0;"><strong>Guests:</strong> ${booking.guests} ${guestLabel}</p>
      </div>
      <p style="margin: 0 0 6px;">If you have any questions, please contact:</p>
      <p style="margin: 0;"><a href="mailto:hello@mosotea.co.nz" style="color: #17341c;">hello@mosotea.co.nz</a></p>
      <p style="margin: 0;"><a href="tel:+64274892131" style="color: #17341c;">+64 27 489 2131</a></p>
    </div>
  `;

  return { text, html };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  const unauthorized = ensureAdminApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { sessionId } = await context.params;
  if (!sessionId || sessionId.trim().length === 0) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }

  let payload: UpdatePayload;
  try {
    payload = (await request.json()) as UpdatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const action = payload.action;
  if (action !== "cancel" && action !== "edit" && action !== "complete") {
    return NextResponse.json({ error: "action must be cancel, edit or complete." }, { status: 400 });
  }

  try {
    const client = getSupabaseAdminClient();
    const { data: session, error: readError } = await client
      .from("booking_sessions")
      .select("id,capacity,booked_count,status,workshop_key,session_date,start_time,end_time,workshop_catalog(title)")
      .eq("id", sessionId)
      .maybeSingle<SessionRow>();
    if (readError) {
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    let nextBooked = session.booked_count;
    let nextStatus = session.status;
    if (action === "cancel") {
      nextBooked = 0;
      nextStatus = "cancelled";
    } else if (action === "complete") {
      if (session.status === "cancelled") {
        return NextResponse.json(
          { error: "Cancelled sessions cannot be marked as completed." },
          { status: 409 }
        );
      }
      nextBooked = session.booked_count;
      nextStatus = "completed";
    } else {
      nextBooked = clampBookedCount(payload.bookedCount ?? session.booked_count);
      if (nextStatus !== "cancelled" || nextBooked > 0) {
        nextStatus = nextBooked >= session.capacity ? "full" : "open";
      }
    }

    let cancellationRecipients: BookingRecipientRow[] = [];
    const resend = action === "cancel" ? getResendConfig() : null;

    if (action === "cancel") {
      if (!resend) {
        return NextResponse.json(
          { error: "Resend is not configured for cancellation emails." },
          { status: 500 }
        );
      }

      const { data: recipients, error: recipientError } = await client
        .from("bookings")
        .select("id,booking_ref,full_name,email,guests")
        .eq("session_id", session.id)
        .eq("status", "confirmed");
      if (recipientError) {
        return NextResponse.json({ error: recipientError.message }, { status: 500 });
      }
      cancellationRecipients = (recipients ?? []) as BookingRecipientRow[];
    }

    const { data: updated, error: updateError } = await client
      .from("booking_sessions")
      .update({
        booked_count: nextBooked,
        status: nextStatus,
      })
      .eq("id", session.id)
      .select("id,capacity,booked_count,status")
      .single<SessionRow>();
    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? "Failed to update session." },
        { status: 500 }
      );
    }

    let warning: string | undefined;
    if (action === "cancel") {
      const { error: bookingUpdateError } = await client
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("session_id", session.id)
        .eq("status", "confirmed");
      if (bookingUpdateError) {
        return NextResponse.json({ error: bookingUpdateError.message }, { status: 500 });
      }

      if (resend && cancellationRecipients.length > 0) {
        const failedRecipients: string[] = [];
        for (const booking of cancellationRecipients) {
          const content = buildCancellationMail(session, booking);
          const { error: mailError } = await resend.client.emails.send({
            from: resend.from,
            to: [booking.email],
            ...(resend.replyTo ? { replyTo: resend.replyTo } : {}),
            subject: CANCELLATION_SUBJECT,
            text: content.text,
            html: content.html,
          });
          if (mailError) {
            failedRecipients.push(booking.email);
          }
        }

        if (failedRecipients.length > 0) {
          warning = `Session cancelled, but ${failedRecipients.length} cancellation email(s) failed: ${failedRecipients.join(", ")}`;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      sessionId: updated.id,
      booked: updated.booked_count,
      total: updated.capacity,
      status: updated.status,
      ...(warning ? { warning } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
