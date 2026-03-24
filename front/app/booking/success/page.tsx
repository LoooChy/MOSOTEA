import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingSuccessPage } from "@/components/booking-react/success-page";

export const metadata: Metadata = {
  title: "Booking Success | Moso Tea",
};

export default function BookingSuccessRoutePage() {
  return (
    <Suspense fallback={null}>
      <BookingSuccessPage />
    </Suspense>
  );
}
