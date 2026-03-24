import type { Metadata } from "next";
import { StaticAdminDesignPage } from "@/components/admin-react/static-admin-design-page";

export const metadata: Metadata = {
  title: "Moso Tea Admin | Sessions",
};

export default async function SessionsRoutePage() {
  return (
    <StaticAdminDesignPage
      file="stitch/admin_booking_overview/code.html"
      pathname="/sessions"
      withSidebar
    />
  );
}

