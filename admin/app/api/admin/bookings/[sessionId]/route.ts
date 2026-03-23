import { NextResponse } from "next/server";
import { ensureAdminApiAuth } from "@/lib/admin-api-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

type SessionRow = {
  id: string;
  capacity: number;
  booked_count: number;
  status: string;
};

type UpdatePayload = {
  action?: "cancel" | "edit";
  bookedCount?: number;
};

function clampBookedCount(raw: number): number {
  if (!Number.isFinite(raw)) {
    return 0;
  }
  return Math.max(0, Math.min(6, Math.floor(raw)));
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
  if (action !== "cancel" && action !== "edit") {
    return NextResponse.json({ error: "action must be cancel or edit." }, { status: 400 });
  }

  try {
    const client = getSupabaseAdminClient();
    const { data: session, error: readError } = await client
      .from("booking_sessions")
      .select("id,capacity,booked_count,status")
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
    } else {
      nextBooked = clampBookedCount(payload.bookedCount ?? session.booked_count);
      if (nextStatus !== "cancelled" || nextBooked > 0) {
        nextStatus = nextBooked >= session.capacity ? "full" : "open";
      }
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

    return NextResponse.json({
      ok: true,
      sessionId: updated.id,
      booked: updated.booked_count,
      total: updated.capacity,
      status: updated.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

