"use client";

import { useEffect } from "react";
import { formatDateLong, parseBookingFlow } from "@/lib/booking-flow";

type BookingSuccessEnhancerProps = {
  enabled: boolean;
};

export function BookingSuccessEnhancer({ enabled }: BookingSuccessEnhancerProps) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
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
      lockBackNavigation();
    };
    window.addEventListener("popstate", onPopState);

    const flow = parseBookingFlow(window.location.search);

    const detailLabels = Array.from(document.querySelectorAll("p")).filter((node) => {
      const normalized = (node.textContent ?? "").trim().toLowerCase();
      return normalized === "date" || normalized === "time" || normalized === "guests";
    });

    detailLabels.forEach((labelNode) => {
      const normalized = (labelNode.textContent ?? "").trim().toLowerCase();
      const parent = labelNode.parentElement;
      const valueNode = parent?.querySelector("p.font-headline.text-xl.text-primary") as
        | HTMLElement
        | null;
      if (!valueNode) {
        return;
      }
      if (normalized === "date") {
        valueNode.textContent = formatDateLong(flow.date);
      }
      if (normalized === "time") {
        valueNode.textContent =
          flow.time && flow.time.trim().length > 0 ? flow.time : "Time Pending";
      }
      if (normalized === "guests") {
        valueNode.textContent = `${flow.guests} ${flow.guests === 1 ? "Traveler" : "Travelers"}`;
      }
    });

    const mailHint = Array.from(document.querySelectorAll("p")).find((node) =>
      /confirmation ritual has been sent/i.test(node.textContent ?? "")
    ) as HTMLElement | undefined;
    if (!mailHint) {
      return () => {
        window.removeEventListener("popstate", onPopState);
      };
    }
    if (flow.email.trim().length === 0) {
      mailHint.textContent = "Booking email was skipped because no email address was provided.";
      return () => {
        window.removeEventListener("popstate", onPopState);
      };
    }

    const bookingRef = flow.bookingRef.trim();
    if (bookingRef.length === 0) {
      mailHint.textContent = "Booking reference is missing. Please complete a new booking.";
      mailHint.classList.add("text-error");
      return () => {
        window.removeEventListener("popstate", onPopState);
      };
    }
    window.localStorage.setItem(completedBookingKey, bookingRef);

    const mailRequestKey = `moso:booking-mail-sent:${bookingRef}`;
    if (window.localStorage.getItem(mailRequestKey) === "sent") {
      mailHint.classList.remove("text-error");
      mailHint.textContent = `A confirmation ritual has been sent to ${flow.email.trim()}.`;
      return () => {
        window.removeEventListener("popstate", onPopState);
      };
    }

    let cancelled = false;
    mailHint.classList.remove("text-error");
    mailHint.textContent = `Sending booking information to ${flow.email.trim()}...`;

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
          mailHint.classList.remove("text-error");
          mailHint.textContent = `A confirmation ritual has been sent to ${flow.email.trim()}.`;
        }
      } catch {
        if (!cancelled) {
          mailHint.textContent = `Failed to send booking email to ${flow.email.trim()}. Please contact us if needed.`;
          mailHint.classList.add("text-error");
        }
      }
    };

    void sendMail();

    return () => {
      cancelled = true;
      window.removeEventListener("popstate", onPopState);
    };
  }, [enabled]);

  return null;
}
