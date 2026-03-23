import { NextResponse } from "next/server";
import { ensureAdminApiAuth } from "@/lib/admin-api-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

type BookingWithSession = {
  id: string;
  booking_ref: string;
  guests: number;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  booking_sessions:
    | {
        id: string;
        session_date: string;
        start_time: string;
        end_time: string;
        workshop_key: string;
        workshop_catalog:
          | {
              title: string;
            }
          | {
              title: string;
            }[]
          | null;
      }
    | {
        id: string;
        session_date: string;
        start_time: string;
        end_time: string;
        workshop_key: string;
        workshop_catalog:
          | {
              title: string;
            }
          | {
              title: string;
            }[]
          | null;
      }[]
    | null;
};

function toPositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.min(max, Math.floor(parsed)));
}

function compactTime(value: string): string {
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) {
    return value;
  }
  return `${match[1]}:${match[2]}`;
}

function toBookings(data: unknown): BookingWithSession[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return data as unknown as BookingWithSession[];
}

function pickSession(
  value: BookingWithSession["booking_sessions"]
): {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  workshop_key: string;
  workshop_catalog: { title: string } | { title: string }[] | null;
} | null {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return (value[0] ?? null) as {
      id: string;
      session_date: string;
      start_time: string;
      end_time: string;
      workshop_key: string;
      workshop_catalog: { title: string } | { title: string }[] | null;
    } | null;
  }
  return value;
}

function pickWorkshopTitle(
  value: { title: string } | { title: string }[] | null,
  fallback: string
): string {
  if (!value) {
    return fallback;
  }
  if (Array.isArray(value)) {
    return value[0]?.title ?? fallback;
  }
  return value.title;
}

export async function GET(request: Request) {
  const unauthorized = ensureAdminApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { searchParams } = new URL(request.url);
  const sessionId = (searchParams.get("sessionId") ?? "").trim();
  const page = toPositiveInt(searchParams.get("page"), 1, 1000000);
  const pageSize = toPositiveInt(searchParams.get("pageSize"), 10, 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const client = getSupabaseAdminClient();
    let query = client
      .from("bookings")
      .select(
        "id,booking_ref,guests,full_name,email,phone,status,booking_sessions(id,session_date,start_time,end_time,workshop_key,workshop_catalog(title))",
        { count: "exact" }
      )
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (sessionId.length > 0) {
      query = query.eq("session_id", sessionId);
    }

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = toBookings(data).map((row) => {
      const session = pickSession(row.booking_sessions);
      const date = session?.session_date ?? "";
      const timeRange =
        session?.start_time && session?.end_time
          ? `${compactTime(session.start_time)} - ${compactTime(session.end_time)}`
          : "";
      return {
        bookingId: row.id,
        bookingRef: row.booking_ref,
        sessionId: session?.id ?? null,
        name: row.full_name,
        email: row.email,
        phone: row.phone,
        guests: row.guests,
        date,
        timeRange,
        project: pickWorkshopTitle(session?.workshop_catalog ?? null, session?.workshop_key ?? ""),
      };
    });

    return NextResponse.json({
      ok: true,
      page,
      pageSize,
      total: count ?? 0,
      items,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
