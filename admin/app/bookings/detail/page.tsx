import type { Metadata } from "next";
import { StaticAdminDesignPage } from "@/components/admin-react/static-admin-design-page";

export const metadata: Metadata = {
  title: "Moso Tea Admin | Booking Detail",
};

export default async function BookingDetailRoutePage() {
  return (
    <StaticAdminDesignPage
      file="stitch/admin_booking_details_customer_profile/code.html"
      pathname="/bookings/detail"
      withSidebar
    />
  );
}

