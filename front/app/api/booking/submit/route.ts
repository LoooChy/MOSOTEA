import { NextResponse } from "next/server";
import {
  BookingPersistPayloadRaw,
  BookingPersistenceError,
  normalizeBookingPayload,
  persistBooking,
  setBookingMailStatus,
} from "@/lib/booking-persistence";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as BookingPersistPayloadRaw;
    const normalized = normalizeBookingPayload(payload);
    const client = getSupabaseAdminClient();
    const result = await persistBooking(client, normalized);
    await setBookingMailStatus(client, normalized.bookingRef, "pending");

    return NextResponse.json({
      ok: true,
      bookingRef: result.bookingRef,
      bookingId: result.bookingId,
      sessionId: result.sessionId,
      guests: result.guests,
      totalAmount: result.totalAmount,
      created: result.created,
    });
  } catch (error) {
    if (error instanceof BookingPersistenceError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

