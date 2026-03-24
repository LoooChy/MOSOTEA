import type { Metadata } from "next";
import { BookingsPage } from "@/components/admin-react/bookings-page";

export const metadata: Metadata = {
  title: "Moso Tea Admin | Bookings",
};

export default function BookingsRoutePage() {
  return <BookingsPage />;
}

