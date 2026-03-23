export type ExperienceKey = "authentic" | "brewing" | "making";

export type BookingFlowParams = {
  experience: ExperienceKey;
  guests: number;
  date: string | null;
  time: string | null;
  fullName: string;
  email: string;
  phone: string;
  notes: string;
};

export const EXPERIENCE_META: Record<ExperienceKey, { title: string; unitPrice: number }> = {
  authentic: { title: "Authentic Ceremony", unitPrice: 50 },
  brewing: { title: "Tradition of Tea Brewing", unitPrice: 50 },
  making: { title: "Art of Tea Making", unitPrice: 50 },
};

export function clampGuests(raw: string | null): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.max(1, Math.min(6, Math.floor(parsed)));
}

export function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function parseBookingFlow(search: string): BookingFlowParams {
  const params = new URLSearchParams(search);
  const experienceRaw = params.get("experience");
  const experience =
    experienceRaw === "authentic" || experienceRaw === "brewing" || experienceRaw === "making"
      ? experienceRaw
      : "authentic";
  return {
    experience,
    guests: clampGuests(params.get("guests")),
    date: params.get("date"),
    time: params.get("time"),
    fullName: params.get("fullName") ?? "",
    email: params.get("email") ?? "",
    phone: params.get("phone") ?? "",
    notes: params.get("notes") ?? "",
  };
}

export function formatDateTimeSummary(dateToken: string | null, timeToken: string | null): string {
  let datePart = "Date Pending";
  if (dateToken && /^\d{4}-\d{2}-\d{2}$/.test(dateToken)) {
    const parsed = new Date(`${dateToken}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      datePart = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(parsed);
    }
  }
  const timePart = timeToken && timeToken.trim().length > 0 ? timeToken : "Time Pending";
  return `${datePart} - ${timePart}`;
}

export function formatDateLong(dateToken: string | null): string {
  if (!dateToken || !/^\d{4}-\d{2}-\d{2}$/.test(dateToken)) {
    return "Date Pending";
  }
  const parsed = new Date(`${dateToken}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "Date Pending";
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

export function buildBookingHref(pathname: string, flow: BookingFlowParams): string {
  const params = new URLSearchParams();
  params.set("experience", flow.experience);
  params.set("guests", String(flow.guests));
  if (flow.date) {
    params.set("date", flow.date);
  }
  if (flow.time) {
    params.set("time", flow.time);
  }
  if (flow.fullName.trim().length > 0) {
    params.set("fullName", flow.fullName.trim());
  }
  if (flow.email.trim().length > 0) {
    params.set("email", flow.email.trim());
  }
  if (flow.phone.trim().length > 0) {
    params.set("phone", flow.phone.trim());
  }
  if (flow.notes.trim().length > 0) {
    params.set("notes", flow.notes.trim());
  }
  return `${pathname}?${params.toString()}`;
}
