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

export function BookingValidatePage() {
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
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
  });

  const nameResult = validateFullName(fullName);
  const emailResult = validateEmail(email.trim());
  const phoneResult = validatePhone(phone);
  const canProceed = nameResult.valid && emailResult.valid && phoneResult.valid;

  const nameState = resolveFieldState(fullName.trim().length > 0, touched.fullName, nameResult.valid);
  const emailState = resolveFieldState(email.trim().length > 0, touched.email, emailResult.valid);
  const phoneState = resolveFieldState(phone.length > 0, touched.phone, phoneResult.valid);

  const summaryExperience = EXPERIENCE_META[flow.experience] ?? EXPERIENCE_META.authentic;
  const summaryDateTime = formatDateTimeSummary(flow.date, flow.time);
  const summaryTotal = formatMoney(summaryExperience.unitPrice * flow.guests);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      phone: true,
    });
    if (!canProceed) {
      return;
    }
    router.push(
      buildBookingHref("/booking/confirm", {
        ...flow,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
      })
    );
  };

  return (
    <FrontSiteShell
      pathname="/booking/validate"
      contentClassName="pt-32 pb-24 px-6 md:px-10 max-w-[1440px] mx-auto relative min-h-screen"
    >
      <div className="grain-overlay absolute inset-0 z-0"></div>
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <section className="lg:col-span-7">
          <header className="mb-12">
            <h1 className="font-headline text-4xl md:text-5xl text-primary mb-4 leading-tight tracking-tight">
              Guest Information
            </h1>
            <p className="text-on-surface-variant font-body text-lg leading-relaxed max-w-xl">
              To prepare the space for your arrival, please provide your contact details.
              Each session is carefully paced to ensure a deep connection with the leaf.
            </p>
          </header>

          <form className="space-y-10" onSubmit={onSubmit}>
            <div className="group">
              <label
                className="block text-xs uppercase tracking-[0.15em] font-label text-secondary mb-3"
                htmlFor="full_name"
              >
                Full Name
              </label>
              <div className="relative">
                <input
                  id="full_name"
                  type="text"
                  maxLength={30}
                  value={fullName}
                  onChange={(event) => setFullName(sanitizeFullName(event.target.value))}
                  onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                  placeholder="E.g. Mei Ling"
                  className={fieldClass(nameState)}
                />
                {statusIcon(nameState)}
              </div>
              {nameState === "error" ? (
                <p className="mt-2 text-sm text-error font-body italic flex items-center gap-1">
                  {nameResult.message}
                </p>
              ) : null}
            </div>

            <div className="group">
              <label
                className="block text-xs uppercase tracking-[0.15em] font-label text-secondary mb-3"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(sanitizeEmail(event.target.value))}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  placeholder="name@domain.com"
                  className={fieldClass(emailState)}
                />
                {statusIcon(emailState)}
              </div>
              {emailState === "error" ? (
                <p className="mt-2 text-sm text-error font-body italic flex items-center gap-1">
                  {emailResult.message}
                </p>
              ) : null}
            </div>

            <div className="group">
              <label
                className="block text-xs uppercase tracking-[0.15em] font-label text-secondary mb-3"
                htmlFor="phone"
              >
                Phone Number
              </label>
              <div className="relative">
                <input
                  id="phone"
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
                <p className="mt-2 text-sm text-error font-body italic">{phoneResult.message}</p>
              ) : null}
            </div>

            <div className="group">
              <label
                className="block text-xs uppercase tracking-[0.15em] font-label text-secondary mb-3"
                htmlFor="notes"
              >
                Ritual Preferences (Optional)
              </label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant/20 focus:ring-0 focus:border-primary-container p-4 rounded-lg font-body text-on-surface transition-all duration-300 resize-none"
                placeholder="Please mention any dietary requirements or preferences for your session..."
              />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={!canProceed}
                className={`group relative inline-flex items-center gap-4 bg-gradient-to-br from-primary to-primary-container text-on-primary px-10 py-5 rounded-full font-label font-bold tracking-wide shadow-lg transition-all duration-500 ${
                  canProceed
                    ? "hover:shadow-primary/20 active:scale-95"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <span>Proceed to Confirmation</span>
                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>
          </form>
        </section>

        <aside className="lg:col-span-5 relative">
          <div className="sticky top-32 space-y-8">
            <div className="bg-surface-container-high p-8 md:p-12 rounded-xl relative overflow-hidden">
              <div className="grain-overlay absolute inset-0"></div>
              <div className="relative z-10">
                <h2 className="font-headline text-2xl text-primary mb-8 border-b border-primary/10 pb-4">
                  Reservation Summary
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-secondary pt-1">spa</span>
                    <div>
                      <p className="text-xs uppercase tracking-widest font-label text-secondary mb-1">
                        Ritual
                      </p>
                      <p className="font-headline text-lg text-primary">{summaryExperience.title}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-secondary pt-1">
                      calendar_today
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-widest font-label text-secondary mb-1">
                        Date & Time
                      </p>
                      <p className="font-headline text-lg text-primary">{summaryDateTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-secondary pt-1">group</span>
                    <div>
                      <p className="text-xs uppercase tracking-widest font-label text-secondary mb-1">
                        Guests
                      </p>
                      <p className="font-headline text-lg text-primary">
                        {flow.guests} {flow.guests === 1 ? "Traveler" : "Travelers"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-12 pt-8 border-t border-primary/10">
                  <div className="flex justify-between items-center text-primary">
                    <span className="font-label uppercase tracking-widest text-xs">
                      Total Investment
                    </span>
                    <span className="font-headline text-2xl">{summaryTotal}</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/60 font-label mt-2 text-right">
                    INCLUDES SERVICE AND TEA TASTING
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </FrontSiteShell>
  );
}

