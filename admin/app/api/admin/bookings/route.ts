import { NextResponse } from "next/server";
import { ensureAdminApiAuth } from "@/lib/admin-api-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

type SessionRow = {
  id: string;
  workshop_key: string;
  session_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  status: string;
  workshop_catalog:
    | {
        title: string;
      }
    | {
        title: string;
      }[]
    | null;
};

type BookingContactRow = {
  session_id: string;
  full_name: string;
  email: string;
  phone: string;
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

function statusLabel(status: string): "open" | "full" | "cancelled" | "completed" {
  if (status === "full" || status === "cancelled" || status === "completed") {
    return status;
  }
  return "open";
}

function toSessionRows(data: unknown): SessionRow[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return data as unknown as SessionRow[];
}

function workshopTitle(value: SessionRow["workshop_catalog"], fallback: string): string {
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
  const scope = searchParams.get("scope") === "history" ? "history" : "upcoming";
  const page = toPositiveInt(searchParams.get("page"), 1, 1000000);
  const pageSize = toPositiveInt(searchParams.get("pageSize"), 10, 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const client = getSupabaseAdminClient();
    let query = client
      .from("booking_sessions")
      .select(
        "id,workshop_key,session_date,start_time,end_time,capacity,booked_count,status,workshop_catalog(title)",
        { count: "exact" }
      )
      .order("session_date", { ascending: scope !== "history" })
      .order("start_time", { ascending: scope !== "history" })
      .range(from, to);

    if (scope === "history") {
      query = query.eq("status", "completed");
    } else {
      query = query.neq("status", "completed");
    }

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const sessions = toSessionRows(data);
    const sessionIds = sessions.map((row) => row.id);
    let contactsMap = new Map<string, BookingContactRow>();
    if (sessionIds.length > 0) {
      const { data: contacts, error: contactsError } = await client
        .from("bookings")
        .select("session_id,full_name,email,phone")
        .eq("status", "confirmed")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: true });
      if (contactsError) {
        return NextResponse.json({ error: contactsError.message }, { status: 500 });
      }
      contactsMap = (contacts ?? []).reduce<Map<string, BookingContactRow>>((map, row) => {
        const contact = row as BookingContactRow;
        if (!map.has(contact.session_id)) {
          map.set(contact.session_id, contact);
        }
        return map;
      }, new Map<string, BookingContactRow>());
    }

    const items = sessions.map((row) => {
      const contact = contactsMap.get(row.id) ?? null;
      return {
        sessionId: row.id,
        workshopKey: row.workshop_key,
        workshopType: workshopTitle(row.workshop_catalog, row.workshop_key),
        date: row.session_date,
        timeRange: `${compactTime(row.start_time)} - ${compactTime(row.end_time)}`,
        booked: row.booked_count,
        total: row.capacity,
        status: statusLabel(row.status),
        primaryContact: contact
          ? {
              name: contact.full_name,
              email: contact.email,
              phone: contact.phone,
            }
          : null,
      };
    });

    return NextResponse.json({
      ok: true,
      scope,
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
