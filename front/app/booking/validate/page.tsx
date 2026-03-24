import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingValidatePage } from "@/components/booking-react/validate-page";

export const metadata: Metadata = {
  title: "Booking Validation | Moso Tea",
};

export default function BookingValidateRoutePage() {
  return (
    <Suspense fallback={null}>
      <BookingValidatePage />
    </Suspense>
  );
}
