import type { Metadata } from "next";
import { HistoryPage } from "@/components/admin-react/bookings-page";

export const metadata: Metadata = {
  title: "Moso Tea Admin | History",
};

export default function HistoryRoutePage() {
  return <HistoryPage />;
}

