"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FrontSiteShell } from "@/components/front-site-shell";
import {
  INPUT_ERROR_CLASS,
  INPUT_NEUTRAL_CLASS,
  INPUT_VALID_CLASS,
  sanitizeEmail,
  sanitizeFullName,
  sanitizePhone,
  validateEmail,
  validateFullName,
  validatePhone,
} from "@/lib/booking-contact";
import {
  buildBookingHref,
  EXPERIENCE_META,
  formatDateTimeSummary,
  formatMoney,
  parseBookingFlow,
} from "@/lib/booking-flow";

type FieldState = "neutral" | "valid" | "error";

function resolveFieldState(hasValue: boolean, touched: boolean, valid: boolean): FieldState {
  if (!hasValue && !touched) {
    return "neutral";
  }
  if (valid && hasValue) {
    return "valid";
  }
  if (touched) {
    return "error";
  }
  return "neutral";
}

function fieldClass(state: FieldState): string {
  if (state === "valid") {
    return INPUT_VALID_CLASS;
  }
  if (state === "error") {
    return INPUT_ERROR_CLASS;
  }
  return INPUT_NEUTRAL_CLASS;
}

function statusIcon(state: FieldState) {
  if (state === "valid") {
    return (
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim">
        <span
          className="material-symbols-outlined text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-error">
        <span
          className="material-symbols-outlined text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          error
        </span>
      </div>
    );
  }
  return null;
}

function createBookingRef(): string {
  return `MOSO-${Date.now()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
}

export function BookingConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flow = useMemo(
    () => parseBookingFlow(`?${searchParams.toString()}`),
    [searchParams]
  );

  const [fullName, setFullName] = useState(flow.fullName);
  const [email, setEmail] = useState(flow.email);
  const [phone, setPhone] = useState(flow.phone);
  const [notes, setNotes] = useState(flow.notes);
  const [bookingRef] = useState(flow.bookingRef.trim() || createBookingRef());
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
  });

  const nameResult = validateFullName(fullName);
  const emailResult = validateEmail(email.trim());
  const phoneResult = validatePhone(phone);
  const canConfirm = nameResult.valid && emailResult.valid && phoneResult.valid;

  const nameState = resolveFieldState(fullName.trim().length > 0, touched.fullName, nameResult.valid);
  const emailState = resolveFieldState(email.trim().length > 0, touched.email, emailResult.valid);
  const phoneState = resolveFieldState(phone.length > 0, touched.phone, phoneResult.valid);

  const summaryExperience = EXPERIENCE_META[flow.experience] ?? EXPERIENCE_META.authentic;
  const summaryDateTime = formatDateTimeSummary(flow.date, flow.time);
  const total = summaryExperience.unitPrice * flow.guests;

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      phone: true,
    });
    if (!canConfirm) {
      return;
    }
    router.push(
      buildBookingHref("/booking/success", {
        ...flow,
        bookingRef,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
      })
    );
  };

  return (
    <FrontSiteShell
      pathname="/booking/confirm"
      contentClassName="pt-32 pb-24 min-h-screen px-6 md:px-12 max-w-[1440px] mx-auto"
    >
      <div className="mb-16 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-headline text-primary tracking-tight">
          Complete your journey.
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
        <div className="lg:col-span-7 space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">person</span>
              <h2 className="text-xl font-headline text-primary">Guest Information</h2>
            </div>
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-label uppercase tracking-wider text-on-surface/60 px-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      maxLength={30}
                      onChange={(event) => setFullName(sanitizeFullName(event.target.value))}
                      onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                      placeholder="Li Wei"
                      className={fieldClass(nameState)}
                    />
                    {statusIcon(nameState)}
                  </div>
                  {nameState === "error" ? (
                    <p className="mt-1 text-sm text-error font-body italic">{nameResult.message}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-label uppercase tracking-wider text-on-surface/60 px-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(sanitizeEmail(event.target.value))}
                      onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                      placeholder="wei@presence.com"
                      className={fieldClass(emailState)}
                    />
                    {statusIcon(emailState)}
                  </div>
                  {emailState === "error" ? (
                    <p className="mt-1 text-sm text-error font-body italic">{emailResult.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-wider text-on-surface/60 px-1">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={phone}
                    onChange={(event) => setPhone(sanitizePhone(event.target.value))}
                    onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                    placeholder="+64 21 000 0000"
                    className={fieldClass(phoneState)}
                  />
                  {statusIcon(phoneState)}
                </div>
                {phoneState === "error" ? (
                  <p className="mt-1 text-sm text-error font-body italic">{phoneResult.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-wider text-on-surface/60 px-1">
                  Special Requirements (Dietary, Accessibility, etc.)
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="bg-surface-container-low border-none rounded-lg p-4 focus:ring-1 focus:ring-primary/20 transition-all font-body text-on-surface resize-none"
                  placeholder="Please let us know if you have any tea sensitivities or require floor-seating adjustments..."
                />
              </div>

              <div className="hidden lg:block pt-8">
                <button
                  type="submit"
                  disabled={!canConfirm}
                  className={`w-full md:w-auto px-12 py-5 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-label font-bold tracking-widest uppercase text-sm transition-all duration-500 ease-out-expo flex items-center justify-center gap-3 ${
                    canConfirm ? "hover:shadow-xl" : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  Confirm Booking
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>

              <div className="lg:hidden mt-12">
                <button
                  type="submit"
                  disabled={!canConfirm}
                  className={`w-full px-8 py-5 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-label font-bold tracking-widest uppercase text-sm shadow-lg flex items-center justify-center gap-3 ${
                    canConfirm ? "" : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  Confirm Booking
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="lg:col-span-5">
          <div className="top-32 bg-surface-container-low p-8 md:p-12 rounded-[2.5rem] shadow-[0_40px_40px_rgba(28,28,25,0.04)]">
            <h2 className="text-2xl font-headline text-primary mb-8">Summary</h2>
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface-container-high flex-shrink-0">
                  <img
                    alt="Workshop Image"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBU0CEriXVVga_ESa0zisdDqOX_Xw19vnC6CiPeBd1QbH-kDqpq-Zr7pLOuZCIf3JEZBb1-DeyKeTVzI8_5GucdtpHer4nulGAY8ZrNrgohWDVSqSututBHhsdXPqzYWS4i53NJwUOnp1lBxw8tR-S0O0hj72CPrRFBZ1KmlkoTEGnPuGJsLFUeGukxCkvPB0gOOG6azhJF49qfljZ1V7MeTilAbu3jPlkFNJ8SXZzfCk6G8ipwiwYYg7aeBzyT3vnh8ssxTGmO7W2v"
                  />
                </div>
                <div>
                  <h3 className="font-headline text-lg text-primary leading-tight mb-1">
                    {summaryExperience.title}
                  </h3>
                  <p className="text-sm text-on-surface/60">MOSO TEA</p>
                </div>
              </div>

              <div className="pt-8 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-label text-on-surface/50 uppercase tracking-widest">
                    Date & Time
                  </span>
                  <span className="font-medium text-on-surface">{summaryDateTime}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-label text-on-surface/50 uppercase tracking-widest">
                    Guests
                  </span>
                  <span className="font-medium text-on-surface">
                    {flow.guests} {flow.guests === 1 ? "Person" : "Persons"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-label text-on-surface/50 uppercase tracking-widest">Rate</span>
                  <span className="font-medium text-on-surface">
                    {formatMoney(summaryExperience.unitPrice)} / person
                  </span>
                </div>
              </div>

              <div className="h-[1px] bg-outline-variant/20 w-full my-8"></div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-label text-on-surface/40 uppercase tracking-widest mb-1">
                    Total Amount
                  </p>
                  <p className="text-4xl font-headline text-primary">{formatMoney(total)}</p>
                </div>
                <div className="text-right text-[10px] text-on-surface/40 font-label uppercase tracking-tighter italic">
                  All taxes included
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FrontSiteShell>
  );
}

