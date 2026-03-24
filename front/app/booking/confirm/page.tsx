import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingConfirmPage } from "@/components/booking-react/confirm-page";

export const metadata: Metadata = {
  title: "Booking Confirmation | Moso Tea",
};

export default function BookingConfirmRoutePage() {
  return (
    <Suspense fallback={null}>
      <BookingConfirmPage />
    </Suspense>
  );
}
