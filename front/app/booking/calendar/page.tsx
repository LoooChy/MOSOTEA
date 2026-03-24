import type { Metadata } from "next";
import { BookingCalendarPage } from "@/components/booking-react/calendar-page";

export const metadata: Metadata = {
  title: "Booking Calendar | Moso Tea",
};

export default function BookingCalendarRoutePage() {
  return <BookingCalendarPage />;
}
