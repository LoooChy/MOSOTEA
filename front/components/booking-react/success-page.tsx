"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FrontSiteShell } from "@/components/front-site-shell";
import { formatDateLong, parseBookingFlow } from "@/lib/booking-flow";

type MailState = "idle" | "sending" | "sent" | "failed" | "skipped";

export function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const flow = useMemo(
    () => parseBookingFlow(`?${searchParams.toString()}`),
    [searchParams]
  );

  const [mailState, setMailState] = useState<MailState>("idle");
  const [mailMessage, setMailMessage] = useState(
    "A confirmation ritual has been sent to your inbox."
  );
  const requestRef = useRef(false);

  useEffect(() => {
    const completedBookingKey = "moso:booking-completed-ref";
    const navigationEntry = window.performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    const navigationType = navigationEntry?.type ?? "navigate";
    const existingCompletedRef = window.localStorage.getItem(completedBookingKey);
    if (navigationType === "back_forward" && existingCompletedRef) {
      window.location.replace("/");
      return;
    }

    const lockBackNavigation = () => {
      window.history.pushState({ mosoBookingSuccess: true }, "", window.location.href);
    };
    lockBackNavigation();

    const onPopState = () => {
      window.location.replace("/");
    };
    window.addEventListener("popstate", onPopState);

    if (requestRef.current) {
      return () => {
        window.removeEventListener("popstate", onPopState);
      };
    }
    requestRef.current = true;

    const bookingRef = flow.bookingRef.trim();
    if (bookingRef.length > 0) {
      window.localStorage.setItem(completedBookingKey, bookingRef);
    }

    if (flow.email.trim().length === 0) {
      setMailState("skipped");
      setMailMessage("Booking email was skipped because no email address was provided.");
      return () => {
        window.removeEventListener("popstate", onPopState);
      };
    }
    if (bookingRef.length === 0) {
      setMailState("failed");
      setMailMessage("Booking reference is missing. Please complete a new booking.");
      return () => {
        window.removeEventListener("popstate", onPopState);
      };
    }

    const mailRequestKey = `moso:booking-mail-sent:${bookingRef}`;
    if (window.localStorage.getItem(mailRequestKey) === "sent") {
      setMailState("sent");
      setMailMessage(`A confirmation ritual has been sent to ${flow.email.trim()}.`);
      return () => {
        window.removeEventListener("popstate", onPopState);
      };
    }

    let cancelled = false;
    setMailState("sending");
    setMailMessage(`Sending booking information to ${flow.email.trim()}...`);

    const sendMail = async () => {
      try {
        const response = await fetch("/api/booking/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingRef,
            experience: flow.experience,
            date: flow.date,
            time: flow.time,
            guests: flow.guests,
            fullName: flow.fullName,
            email: flow.email,
            phone: flow.phone,
            notes: flow.notes,
          }),
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          const message = errorPayload?.error ?? `HTTP ${response.status}`;
          throw new Error(message);
        }

        window.localStorage.setItem(mailRequestKey, "sent");
        if (!cancelled) {
          setMailState("sent");
          setMailMessage(`A confirmation ritual has been sent to ${flow.email.trim()}.`);
        }
      } catch {
        if (!cancelled) {
          setMailState("failed");
          setMailMessage(
            `Failed to send booking email to ${flow.email.trim()}. Please contact us if needed.`
          );
        }
      }
    };

    void sendMail();

    return () => {
      cancelled = true;
      window.removeEventListener("popstate", onPopState);
    };
  }, [flow]);

  return (
    <FrontSiteShell
      pathname="/booking/success"
      contentClassName="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-surface px-6 py-16 md:py-24"
    >
      <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-secondary/5 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-2xl w-full text-center space-y-12">
        <div className="relative inline-block">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
            <span
              className="material-symbols-outlined text-primary text-6xl md:text-7xl font-light"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
            >
              local_drink
            </span>
          </div>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-40">
            <span
              className="material-symbols-outlined text-secondary text-4xl"
              style={{ fontVariationSettings: "'wght' 100" }}
            >
              air
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-primary tracking-tight leading-tight">
            Your Journey Begins
          </h1>
          <p className="text-on-surface/60 text-lg md:text-xl max-w-md mx-auto leading-relaxed">
            A space has been prepared for you. We look forward to sharing this ritual at Moso Tea.
          </p>
        </div>

        <div className="bg-surface-container-low/50 backdrop-blur-sm p-8 md:p-12 rounded-xl relative group overflow-hidden">
          <div className="absolute inset-0 border border-outline-variant/15 rounded-xl pointer-events-none"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-on-surface/40 font-semibold">Date</p>
              <p className="font-headline text-xl text-primary">{formatDateLong(flow.date)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-on-surface/40 font-semibold">Time</p>
              <p className="font-headline text-xl text-primary">
                {flow.time && flow.time.trim().length > 0 ? flow.time : "Time Pending"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-on-surface/40 font-semibold">Guests</p>
              <p className="font-headline text-xl text-primary">
                {flow.guests} {flow.guests === 1 ? "Traveler" : "Travelers"}
              </p>
            </div>
          </div>
          <div className="mt-10 pt-10 border-t border-outline-variant/10 text-center">
            <div
              className={`flex items-center justify-center gap-2 ${
                mailState === "failed" ? "text-error" : "text-secondary/70"
              }`}
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              <p className="text-sm font-medium tracking-wide">{mailMessage}</p>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <a
            href="/"
            className="inline-flex items-center justify-center px-10 py-5 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-medium tracking-wide hover:shadow-xl hover:shadow-primary/10 transition-all duration-700 ease-out-expo group"
          >
            <span>Return Home</span>
            <span className="material-symbols-outlined ml-2 text-lg group-hover:translate-x-1 transition-transform duration-500">
              arrow_right_alt
            </span>
          </a>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-30">
        <p className="font-headline italic text-xl tracking-tighter text-primary">MOSO TEA</p>
      </div>
    </FrontSiteShell>
  );
}

