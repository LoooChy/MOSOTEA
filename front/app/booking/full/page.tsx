import type { Metadata } from "next";
import { StaticDesignPage } from "@/components/front-pages/static-design-page";

export const metadata: Metadata = {
  title: "Session Full | Moso Tea",
};

export default async function BookingFullPage() {
  return (
    <StaticDesignPage
      file="stitch/booking_error_full_capacity_desktop/code.html"
      pathname="/booking/full"
    />
  );
}

