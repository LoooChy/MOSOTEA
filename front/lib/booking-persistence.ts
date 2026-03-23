import { SupabaseClient } from "@supabase/supabase-js";
import {
  sanitizeEmail,
  sanitizeFullName,
  sanitizePhone,
  validateEmail,
  validateFullName,
  validatePhone,
} from "@/lib/booking-contact";
import { EXPERIENCE_META, ExperienceKey } from "@/lib/booking-flow";

export type BookingPersistPayloadRaw = {
  bookingRef?: string;
  experience?: string;
  date?: string | null;
  time?: string | null;
  guests?: number;
  fullName?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type NormalizedBookingPayload = {
  bookingRef: string;
  experienceKey: ExperienceKey;
  date: string;
  timeRange: string;
  guests: number;
  fullName: string;
  email: string;
  phone: string;
  notes: string;
  unitPrice: number;
  totalAmount: number;
};

type SessionRow = {
  id: string;
  capacity: number;
  booked_count: number;
  status: string;
};

type BookingRow = {
  id: string;
  booking_ref: string;
  session_id: string;
  guests: number;
  total_amount: number | string;
};

export type PersistBookingResult = {
  created: boolean;
  bookingId: string;
  bookingRef: string;
  sessionId: string;
  totalAmount: number;
  guests: number;
};

const DEFAULT_CAPACITY = 6;
const EMPTY_SINGLE_RESULT_CODE = "PGRST116";

export class BookingPersistenceError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "BOOKING_PERSISTENCE_ERROR") {
    super(message);
    this.name = "BookingPersistenceError";
    this.status = status;
    this.code = code;
  }
}

function parseExperienceKey(raw: string | undefined): ExperienceKey {
  if (raw === "authentic" || raw === "brewing" || raw === "making") {
    return raw;
  }
  return "authentic";
}

function parseGuests(raw: number | undefined): number {
  const value = Number(raw ?? 1);
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.min(6, Math.floor(value)));
}

function normalizeDateToken(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BookingPersistenceError("Date must use YYYY-MM-DD format.", 400, "INVALID_DATE");
  }
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new BookingPersistenceError("Invalid booking date.", 400, "INVALID_DATE");
  }
  return value;
}

function normalizeTimePart(value: string): string {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new BookingPersistenceError("Invalid booking time format.", 400, "INVALID_TIME");
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new BookingPersistenceError("Invalid booking time value.", 400, "INVALID_TIME");
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function normalizeTimeRange(raw: string | null | undefined): string {
  const value = (raw ?? "").replace(/\s+/g, " ").trim();
  const range = value.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
  if (!range) {
    throw new BookingPersistenceError(
      "Time must use range format like 14:00 - 15:30.",
      400,
      "INVALID_TIME_RANGE"
    );
  }
  const start = normalizeTimePart(range[1]);
  const end = normalizeTimePart(range[2]);
  return `${start} - ${end}`;
}

function getTimeParts(timeRange: string): { start: string; end: string } {
  const match = timeRange.match(/^(\d{2}:\d{2})\s-\s(\d{2}:\d{2})$/);
  if (!match) {
    throw new BookingPersistenceError("Invalid normalized time range.", 400, "INVALID_TIME_RANGE");
  }
  return {
    start: `${match[1]}:00`,
    end: `${match[2]}:00`,
  };
}

function normalizeBookingRef(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (value.length > 0) {
    return value;
  }
  return `MOSO-${Date.now()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
}

function toNumber(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeBookingPayload(raw: BookingPersistPayloadRaw): NormalizedBookingPayload {
  const experienceKey = parseExperienceKey(raw.experience);
  const guests = parseGuests(raw.guests);
  const unitPrice = EXPERIENCE_META[experienceKey].unitPrice;
  const bookingRef = normalizeBookingRef(raw.bookingRef);
  const fullName = sanitizeFullName(raw.fullName ?? "").trim();
  const email = sanitizeEmail(raw.email ?? "").trim();
  const phone = sanitizePhone(raw.phone ?? "").trim();
  const nameValidation = validateFullName(fullName);
  const emailValidation = validateEmail(email);
  const phoneValidation = validatePhone(phone);

  if (!nameValidation.valid) {
    throw new BookingPersistenceError(nameValidation.message, 400, "INVALID_FULL_NAME");
  }
  if (!emailValidation.valid) {
    throw new BookingPersistenceError(emailValidation.message, 400, "INVALID_EMAIL");
  }
  if (!phoneValidation.valid) {
    throw new BookingPersistenceError(phoneValidation.message, 400, "INVALID_PHONE");
  }

  const date = normalizeDateToken(raw.date);
  const timeRange = normalizeTimeRange(raw.time);

  return {
    bookingRef,
    experienceKey,
    date,
    timeRange,
    guests,
    fullName,
    email,
    phone,
    notes: (raw.notes ?? "").trim(),
    unitPrice,
    totalAmount: unitPrice * guests,
  };
}

async function findOrCreateSession(
  client: SupabaseClient,
  payload: NormalizedBookingPayload
): Promise<SessionRow> {
  const timeParts = getTimeParts(payload.timeRange);
  const { data, error } = await client
    .from("booking_sessions")
    .select("id,capacity,booked_count,status")
    .eq("workshop_key", payload.experienceKey)
    .eq("session_date", payload.date)
    .eq("start_time", timeParts.start)
    .eq("end_time", timeParts.end)
    .maybeSingle<SessionRow>();

  if (error && error.code !== EMPTY_SINGLE_RESULT_CODE) {
    throw new BookingPersistenceError(error.message, 500, "READ_SESSION_FAILED");
  }
  if (data) {
    return data;
  }

  const { data: inserted, error: insertError } = await client
    .from("booking_sessions")
    .insert({
      workshop_key: payload.experienceKey,
      session_date: payload.date,
      start_time: timeParts.start,
      end_time: timeParts.end,
      capacity: DEFAULT_CAPACITY,
      booked_count: 0,
      status: "open",
    })
    .select("id,capacity,booked_count,status")
    .single<SessionRow>();

  if (insertError || !inserted) {
    throw new BookingPersistenceError(
      insertError?.message ?? "Failed to create booking session.",
      500,
      "CREATE_SESSION_FAILED"
    );
  }
  return inserted;
}

export async function persistBooking(
  client: SupabaseClient,
  payload: NormalizedBookingPayload
): Promise<PersistBookingResult> {
  const { data: existingBooking, error: existingError } = await client
    .from("bookings")
    .select("id,booking_ref,session_id,guests,total_amount")
    .eq("booking_ref", payload.bookingRef)
    .maybeSingle<BookingRow>();

  if (existingError && existingError.code !== EMPTY_SINGLE_RESULT_CODE) {
    throw new BookingPersistenceError(existingError.message, 500, "READ_BOOKING_FAILED");
  }
  if (existingBooking) {
    return {
      created: false,
      bookingId: existingBooking.id,
      bookingRef: existingBooking.booking_ref,
      sessionId: existingBooking.session_id,
      totalAmount: toNumber(existingBooking.total_amount),
      guests: existingBooking.guests,
    };
  }

  const session = await findOrCreateSession(client, payload);
  if (session.status === "cancelled" || session.status === "completed") {
    throw new BookingPersistenceError(
      "This session is unavailable.",
      409,
      "SESSION_UNAVAILABLE"
    );
  }

  const bookedCount = toNumber(session.booked_count);
  const capacity = toNumber(session.capacity);
  if (bookedCount + payload.guests > capacity) {
    throw new BookingPersistenceError("Not enough spots left for this session.", 409, "SESSION_FULL");
  }

  const { data: insertedBooking, error: insertBookingError } = await client
    .from("bookings")
    .insert({
      booking_ref: payload.bookingRef,
      session_id: session.id,
      workshop_key: payload.experienceKey,
      guests: payload.guests,
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      notes: payload.notes,
      status: "confirmed",
      total_amount: payload.totalAmount,
      source: "front",
    })
    .select("id,booking_ref,session_id,guests,total_amount")
    .single<BookingRow>();

  if (insertBookingError || !insertedBooking) {
    throw new BookingPersistenceError(
      insertBookingError?.message ?? "Failed to create booking.",
      500,
      "CREATE_BOOKING_FAILED"
    );
  }

  const nextBookedCount = bookedCount + payload.guests;
  const nextStatus = nextBookedCount >= capacity ? "full" : "open";
  const { error: updateSessionError } = await client
    .from("booking_sessions")
    .update({
      booked_count: nextBookedCount,
      status: nextStatus,
    })
    .eq("id", session.id);

  if (updateSessionError) {
    throw new BookingPersistenceError(
      updateSessionError.message,
      500,
      "UPDATE_SESSION_FAILED"
    );
  }

  return {
    created: true,
    bookingId: insertedBooking.id,
    bookingRef: insertedBooking.booking_ref,
    sessionId: insertedBooking.session_id,
    totalAmount: toNumber(insertedBooking.total_amount),
    guests: insertedBooking.guests,
  };
}

export async function setBookingMailStatus(
  client: SupabaseClient,
  bookingRef: string,
  status: "pending" | "sent" | "failed"
): Promise<void> {
  const { error } = await client
    .from("bookings")
    .update({ mail_status: status })
    .eq("booking_ref", bookingRef);
  if (error) {
    throw new BookingPersistenceError(error.message, 500, "UPDATE_MAIL_STATUS_FAILED");
  }
}
