"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FrontSiteShell } from "@/components/front-site-shell";
import { EXPERIENCE_META, ExperienceKey } from "@/lib/booking-flow";

type ExperienceCard = {
  key: ExperienceKey;
  title: string;
  description: string;
  image: string;
};

type TimeSlot = {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  soldOut: boolean;
  spotsLeft: number;
};

const EXPERIENCE_CARDS: ExperienceCard[] = [
  {
    key: "authentic",
    title: "Authentic Ceremony",
    description: "A meditative exploration of form and flavor.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBu3gjOhgGkr3OQI9dQzymADrU04Slf0aQ6uB90_2IOxu1phoREQfVe5O1ksCK_xlqvxKNXkcAThfbWbn9_wv3MzJFHE-oFECs0RaKWfHi-LOvpt1nlT0pn7sE8Wjg9QYEPS64QGfJ3hwVgpPxSh0MsVOs0C1ozeY5NdpDuUrGcFqtgzQRmyT5m-34Bm2pgdXyAcj6pOjlQLPzEgyAyDwylbocnSJC4lgonyXYVsJk1x_ncIY_OSd-ee_64OGd-wr25rz-kMv_53Bx4",
  },
  {
    key: "brewing",
    title: "Brewing",
    description: "Mastering the physics of water and leaf.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHXMVERpRrQb6W7SsuNdW-5rk8Z2yHPh8C-mpBCQy-W0AbKjqGzBhufb10oD_Dsi77jgmftpowwRnx92orsW2OEiYaB686c0CDMJs6gU2-tYUCGUGzJcvSHo-7tLWkzNJWDo3-gBd-Mo2W60UB-SnJw9FGeFQFQlV9e1aWw6V1Q02oeJSvqqH9ExRKVoA60KciNwWiR5ksOHzXl4UDPD5daJw5YCuvH2mq7ORtoMOgE-BcQg1FaWGAgWmfUdLOOXIO8I1QQKod9AcG",
  },
  {
    key: "making",
    title: "Tea Making",
    description: "The tactile art of processing raw leaves.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCqnaRgLwti4Db7TJ2sv_hBZ8PBPgoRxg86aF-2byg5y-b-vgQxK4tajU1pMhLc8zmjhjV-EKZ2hy4FImA21HoHyX6tN4B2QU3IoxwM9y85gVCFrI8ycJlEPqd7Qv-XVt7icEvVSEFxIPNVC3_T-KXO9mDwCL1NlbDFNtbXqZt7qVRVzqnHBzVF-g6fkp3wIO9NZ7ZMnwtUHCV9W1K_K_jJ30X5U6WGq9E0uHGYV7CAkiPvWWhlJDqnHpnlH4RUd8NIN7O-KeSN7oq",
  },
];

const SLOT_META: Record<string, { subtitle: string; icon: string }> = {
  "09:00 - 10:30": { subtitle: "Morning Mist Session", icon: "wb_twilight" },
  "11:30 - 13:00": { subtitle: "Zenith Light Session", icon: "light_mode" },
  "14:00 - 15:30": { subtitle: "Golden Hour Session", icon: "wb_sunny" },
  "16:30 - 18:00": { subtitle: "Dusk Ritual", icon: "nights_stay" },
};

function getDefaultSlots(): TimeSlot[] {
  return [
    {
      id: "09:00 - 10:30",
      label: "09:00 - 10:30",
      subtitle: "Morning Mist Session",
      icon: "wb_twilight",
      soldOut: false,
      spotsLeft: 4,
    },
    {
      id: "11:30 - 13:00",
      label: "11:30 - 13:00",
      subtitle: "Zenith Light Session",
      icon: "light_mode",
      soldOut: false,
      spotsLeft: 2,
    },
    {
      id: "14:00 - 15:30",
      label: "14:00 - 15:30",
      subtitle: "Golden Hour Session",
      icon: "wb_sunny",
      soldOut: false,
      spotsLeft: 6,
    },
    {
      id: "16:30 - 18:00",
      label: "16:30 - 18:00",
      subtitle: "Dusk Ritual",
      icon: "nights_stay",
      soldOut: true,
      spotsLeft: 0,
    },
  ];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateToken(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateToken(token: string | null): Date | null {
  if (!token || !/^\d{4}-\d{2}-\d{2}$/.test(token)) {
    return null;
  }
  const parsed = new Date(`${token}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function normalizeTimeLabel(raw: string): string {
  const compact = raw.replace(/\s+/g, " ").trim();
  const range = compact.match(/(\d{1,2}:\d{2})\D+(\d{1,2}:\d{2})/);
  if (range) {
    return `${range[1]} - ${range[2]}`;
  }
  const single = compact.match(/(\d{1,2}:\d{2})/);
  if (single) {
    return single[1];
  }
  return compact;
}

function formatSummaryDateTime(date: Date, time: string): string {
  const label = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
  return `${label} - ${time}`;
}

function formatCurrentTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildCalendarCells(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, idx) => {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + idx);
    return current;
  });
}

export function BookingCalendarPage() {
  const router = useRouter();
  const experienceRef = useRef<HTMLElement | null>(null);
  const dateRef = useRef<HTMLElement | null>(null);
  const [today] = useState<Date>(() => startOfDay(new Date()));
  const [initialTime] = useState<string>(() => formatCurrentTime(new Date()));
  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);

  const [ready, setReady] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceKey>("authentic");
  const [selectedDate, setSelectedDate] = useState<Date>(tomorrow);
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1)
  );
  const [selectedGuests, setSelectedGuests] = useState(1);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(getDefaultSlots());

  useEffect(() => {
    const completedBookingKey = "moso:booking-completed-ref";
    const navigationEntry = window.performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    const navigationType = navigationEntry?.type ?? "navigate";
    const completedBookingRef = window.localStorage.getItem(completedBookingKey);
    if (completedBookingRef) {
      if (navigationType === "back_forward") {
        window.location.replace("/");
        return;
      }
      window.localStorage.removeItem(completedBookingKey);
    }

    const params = new URLSearchParams(window.location.search);
    const experienceRaw = params.get("experience");
    if (experienceRaw === "authentic" || experienceRaw === "brewing" || experienceRaw === "making") {
      setSelectedExperience(experienceRaw);
    }
    const guestRaw = Number(params.get("guests"));
    if (Number.isFinite(guestRaw)) {
      setSelectedGuests(Math.max(1, Math.min(6, Math.floor(guestRaw))));
    }
    const dateRaw = parseDateToken(params.get("date"));
    if (dateRaw && startOfDay(dateRaw).getTime() > today.getTime()) {
      setSelectedDate(dateRaw);
      setVisibleMonth(new Date(dateRaw.getFullYear(), dateRaw.getMonth(), 1));
    }
    const timeRaw = params.get("time");
    if (timeRaw && timeRaw.trim().length > 0) {
      const normalized = normalizeTimeLabel(timeRaw);
      setSelectedTime(normalized);
      if (normalized.includes(" - ")) {
        setSelectedSlot(normalized);
      }
    }
    setReady(true);
  }, [today]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("experience", selectedExperience);
    url.searchParams.set("date", formatDateToken(selectedDate));
    url.searchParams.set("time", selectedTime);
    url.searchParams.set("guests", String(selectedGuests));
    window.history.replaceState({}, "", url.toString());
  }, [ready, selectedExperience, selectedDate, selectedTime, selectedGuests]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const loadAvailability = async () => {
      try {
        const response = await fetch(
          `/api/booking/availability?date=${formatDateToken(selectedDate)}&workshop=${selectedExperience}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as {
          sessions?: Array<{
            time: string;
            spotsLeft: number;
            status: string;
          }>;
        };
        const sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
        const mapped =
          sessions.length > 0
            ? sessions.map((item) => {
                const label = normalizeTimeLabel(item.time);
                const meta = SLOT_META[label] ?? {
                  subtitle: "Tea Session",
                  icon: "schedule",
                };
                const soldOut =
                  item.status === "full" || item.status === "cancelled" || item.spotsLeft <= 0;
                return {
                  id: label,
                  label,
                  subtitle: meta.subtitle,
                  icon: meta.icon,
                  soldOut,
                  spotsLeft: Math.max(0, item.spotsLeft),
                };
              })
            : getDefaultSlots();

        if (!cancelled) {
          setTimeSlots(mapped);
          setSelectedSlot((current) => {
            if (!current) {
              return null;
            }
            const hit = mapped.find((slot) => slot.label === current && !slot.soldOut);
            if (hit) {
              return current;
            }
            setSelectedTime(formatCurrentTime(new Date()));
            return null;
          });
        }
      } catch {
        if (!cancelled) {
          setTimeSlots(getDefaultSlots());
        }
      }
    };

    void loadAvailability();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [ready, selectedDate, selectedExperience]);

  const totalPrice = EXPERIENCE_META[selectedExperience].unitPrice * selectedGuests;
  const summaryDateTime = formatSummaryDateTime(selectedDate, selectedTime);
  const canContinue = Boolean(selectedSlot);
  const calendarCells = buildCalendarCells(visibleMonth);
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);

  const onContinue = () => {
    if (!canContinue || !selectedSlot) {
      return;
    }
    const params = new URLSearchParams();
    params.set("experience", selectedExperience);
    params.set("date", formatDateToken(selectedDate));
    params.set("time", selectedSlot);
    params.set("guests", String(selectedGuests));
    router.push(`/booking/validate?${params.toString()}`);
  };

  return (
    <FrontSiteShell
      pathname="/booking/calendar"
      contentClassName="pt-32 pb-24 px-6 md:px-12 max-w-[1440px] mx-auto min-h-screen"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-16">
          <section ref={experienceRef}>
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="font-headline text-4xl text-primary font-light">Choose your journey</h2>
              <span className="text-sm font-label text-primary/40 uppercase tracking-widest">Step 01 / 03</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {EXPERIENCE_CARDS.map((card) => {
                const active = selectedExperience === card.key;
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => setSelectedExperience(card.key)}
                    className={`group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer bg-surface-container-high transition-all duration-700 text-left ${
                      active ? "hover:shadow-2xl" : "hover:-translate-y-2"
                    }`}
                  >
                    <img
                      alt={card.title}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                        active
                          ? "transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                          : "grayscale group-hover:grayscale-0 opacity-60"
                      }`}
                      src={card.image}
                    />
                    <div
                      className={`absolute inset-0 ${
                        active
                          ? "bg-gradient-to-t from-primary/90 via-primary/20 to-transparent"
                          : "bg-gradient-to-t from-on-surface/80 via-transparent to-transparent"
                      }`}
                    />
                    <div className="absolute bottom-0 left-0 p-6">
                      <h3 className="font-headline text-xl text-white mb-2">{card.title}</h3>
                      <p className="text-white/70 text-sm line-clamp-2">{card.description}</p>
                    </div>
                    {active ? (
                      <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20">
                        <span
                          className="material-symbols-outlined text-white text-sm"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section ref={dateRef} className="space-y-8">
            <div className="flex items-baseline justify-between">
              <h2 className="font-headline text-4xl text-primary font-light">Select a date</h2>
              <span className="text-sm font-label text-primary/40 uppercase tracking-widest">Step 02 / 03</span>
            </div>
            <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center space-x-4">
                  <h3 className="font-headline text-2xl text-primary">{monthLabel}</h3>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      className="p-2 hover:bg-surface-container rounded-full transition-colors"
                      onClick={() =>
                        setVisibleMonth(
                          new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
                        )
                      }
                    >
                      <span className="material-symbols-outlined text-primary text-xl">
                        chevron_left
                      </span>
                    </button>
                    <button
                      type="button"
                      className="p-2 hover:bg-surface-container rounded-full transition-colors"
                      onClick={() =>
                        setVisibleMonth(
                          new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
                        )
                      }
                    >
                      <span className="material-symbols-outlined text-primary text-xl">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-y-6">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                  <div
                    key={day}
                    className={`text-center text-xs font-label uppercase tracking-widest mb-4 ${
                      index >= 5 ? "text-primary/60" : "text-on-surface/30"
                    }`}
                  >
                    {day}
                  </div>
                ))}
                {calendarCells.map((cell) => {
                  const inCurrentMonth = cell.getMonth() === visibleMonth.getMonth();
                  if (!inCurrentMonth) {
                    return (
                      <div
                        key={cell.toISOString()}
                        className="aspect-square flex items-center justify-center text-on-surface/10"
                      >
                        -
                      </div>
                    );
                  }
                  const selectable = startOfDay(cell).getTime() > today.getTime();
                  const active = selectable && isSameDay(cell, selectedDate);
                  if (!selectable) {
                    return (
                      <div
                        key={cell.toISOString()}
                        className="aspect-square flex items-center justify-center text-on-surface/20 cursor-not-allowed"
                      >
                        {cell.getDate()}
                      </div>
                    );
                  }
                  return (
                    <button
                      key={cell.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(cell)}
                      className={
                        active
                          ? "aspect-square flex flex-col items-center justify-center rounded-2xl bg-primary text-on-primary shadow-xl shadow-primary/20 transform scale-105 z-10"
                          : "aspect-square flex flex-col items-center justify-center rounded-2xl border border-primary/10 hover:bg-surface-container transition-all"
                      }
                    >
                      <span className="text-lg font-headline">{cell.getDate()}</span>
                      <span
                        className={`text-[8px] uppercase tracking-tighter mt-1 ${
                          active ? "opacity-70" : "text-primary/40"
                        }`}
                      >
                        {active ? "Chosen" : "Avail"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <div className="flex items-baseline justify-between">
              <h2 className="font-headline text-4xl text-primary font-light">Available times</h2>
              <span className="text-sm font-label text-primary/40 uppercase tracking-widest">Step 03 / 03</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {timeSlots.map((slot) => {
                const active = selectedSlot === slot.label && !slot.soldOut;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={slot.soldOut}
                    onClick={() => {
                      if (slot.soldOut) {
                        return;
                      }
                      setSelectedSlot(slot.label);
                      setSelectedTime(slot.label);
                    }}
                    className={`p-6 rounded-xl border border-primary/5 flex items-center justify-between group transition-all duration-500 ${
                      slot.soldOut
                        ? "bg-surface-container-lowest cursor-not-allowed opacity-60"
                        : active
                          ? "bg-primary text-on-primary ring-2 ring-primary ring-offset-4 ring-offset-surface"
                          : "bg-surface-container-lowest cursor-pointer hover:bg-primary hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          active ? "bg-white/10" : "bg-surface-container-high group-hover:bg-white/10"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined ${
                            active ? "text-white" : "text-primary group-hover:text-white"
                          }`}
                        >
                          {slot.icon}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-headline">{slot.label.replace(" - ", " — ")}</div>
                        <div
                          className={
                            active
                              ? "text-sm text-white/60"
                              : "text-sm text-on-surface/50 group-hover:text-white/60"
                          }
                        >
                          {slot.subtitle}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {slot.soldOut ? (
                        <span className="block text-xs font-label uppercase tracking-widest text-error">
                          Sold out
                        </span>
                      ) : (
                        <span
                          className={`block text-xs font-label uppercase tracking-widest ${
                            active ? "text-white" : "text-primary group-hover:text-white"
                          }`}
                        >
                          {slot.spotsLeft} spots left
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-32 p-10 rounded-3xl bg-surface-container-low shadow-sm border border-outline-variant/10 space-y-10">
            <div>
              <h3 className="font-headline text-2xl text-primary mb-6">Reservation Summary</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-on-surface/40 mb-1">
                      Experience
                    </div>
                    <div className="font-headline text-lg">{EXPERIENCE_META[selectedExperience].title}</div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-primary underline underline-offset-4 uppercase tracking-tighter"
                    onClick={() =>
                      experienceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                  >
                    Change
                  </button>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-on-surface/40 mb-1">
                      Date & Time
                    </div>
                    <div className="font-headline text-lg">{summaryDateTime}</div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-primary underline underline-offset-4 uppercase tracking-tighter"
                    onClick={() => dateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    Change
                  </button>
                </div>
                <div className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-on-surface/40 mb-1">Guests</div>
                    <div className="text-sm font-headline text-primary">{selectedGuests}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={selectedGuests <= 1}
                      onClick={() => setSelectedGuests((current) => Math.max(1, current - 1))}
                      className="w-9 h-9 rounded-full border border-primary/20 text-primary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      disabled={selectedGuests >= 6}
                      onClick={() => setSelectedGuests((current) => Math.min(6, current + 1))}
                      className="w-9 h-9 rounded-full border border-primary/20 text-primary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="pt-6 border-t border-outline-variant/20 flex justify-between items-baseline">
                  <div className="text-xs uppercase tracking-widest text-on-surface/40">
                    Total for {selectedGuests} {selectedGuests === 1 ? "Guest" : "Guests"}
                  </div>
                  <div className="text-3xl font-headline text-primary">{formatMoney(totalPrice)}</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <button
                type="button"
                disabled={!canContinue}
                onClick={onContinue}
                className={`w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-5 rounded-full font-label tracking-widest uppercase text-sm shadow-xl transition-all duration-500 ${
                  canContinue
                    ? "hover:shadow-primary/20 active:scale-[0.98]"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                Continue to Guest Info
              </button>
              <p className="text-[10px] text-center text-on-surface/40 uppercase tracking-widest leading-relaxed">
                Cancellations permitted up to 24 hours prior to the session start time.
              </p>
            </div>
            <div className="relative h-48 w-full rounded-2xl overflow-hidden mt-8 grayscale opacity-40">
              <img
                alt="Close up of a textured ceramic tea cup"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNy5RkRu7ALP0eq2ESrjZgfkJr4zb3xSGBbxxcCw7fIdncXiZKWbQCsr3LvqDF1B5y2gDjclaHLl0UL-ZTNxCTPrSwD5C-UDa5RsABoWdkHCMSkhkqiO0c15IIS3LeOhmggDs9GazuuhKK1ROTqA6sQZa8H_x9mZhXRiji9tfHtTXFx8bSZl64Mvgr2A82-_E2hAiM5VJ92ePxmREY3Zkah2UzgvIR0kqwyf5MNlzHviA0Niszcl2F4lmrrNnGJdjyANrMtxSHoRMn"
              />
              <div className="absolute inset-0 bg-surface-container-low/20"></div>
            </div>
          </div>
        </aside>
      </div>
    </FrontSiteShell>
  );
}

