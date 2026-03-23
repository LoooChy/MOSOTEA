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

    if (flow.email.trim().length > 0) {
      const mailHint = Array.from(document.querySelectorAll("p")).find((node) =>
        /confirmation ritual has been sent/i.test(node.textContent ?? "")
      ) as HTMLElement | undefined;
      if (mailHint) {
        mailHint.textContent = `A confirmation ritual has been sent to ${flow.email.trim()}.`;
      }
    }
  }, [enabled]);

  return null;
}
