import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

type SessionWithWorkshop = {
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
        unit_price: number | string;
      }
    | {
        title: string;
        unit_price: number | string;
      }[]
    | null;
};

type WorkshopMeta = {
  title: string;
  unit_price: number | string;
};

function pickWorkshopMeta(value: SessionWithWorkshop["workshop_catalog"]): WorkshopMeta | null {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return (value[0] ?? null) as WorkshopMeta | null;
  }
  return value as WorkshopMeta;
}

function toSessionRows(data: unknown): SessionWithWorkshop[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return data as unknown as SessionWithWorkshop[];
}

function toNumber(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDateToken(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function compactTime(value: string): string {
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) {
    return value;
  }
  return `${match[1]}:${match[2]}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = normalizeDateToken(searchParams.get("date"));
  const workshop = searchParams.get("workshop");
  if (!date) {
    return NextResponse.json(
      { error: "date is required with YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  try {
    const client = getSupabaseAdminClient();
    let query = client
      .from("booking_sessions")
      .select(
        "id,workshop_key,session_date,start_time,end_time,capacity,booked_count,status,workshop_catalog(title,unit_price)"
      )
      .eq("session_date", date)
      .order("start_time", { ascending: true });

    if (workshop && workshop.trim().length > 0) {
      query = query.eq("workshop_key", workshop.trim());
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const sessions = toSessionRows(data).map((row) => {
      const workshopMeta = pickWorkshopMeta(row.workshop_catalog);
      const capacity = toNumber(row.capacity);
      const booked = toNumber(row.booked_count);
      const spotsLeft = Math.max(0, capacity - booked);
      return {
        sessionId: row.id,
        experience: row.workshop_key,
        workshopTitle: workshopMeta?.title ?? row.workshop_key,
        unitPrice: toNumber(workshopMeta?.unit_price ?? 0),
        date: row.session_date,
        time: `${compactTime(row.start_time)} - ${compactTime(row.end_time)}`,
        capacity,
        booked,
        spotsLeft,
        status: row.status,
      };
    });

    return NextResponse.json({
      ok: true,
      date,
      total: sessions.length,
      sessions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
