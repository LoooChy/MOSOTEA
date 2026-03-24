import type { Metadata } from "next";
import { StaticAdminDesignPage } from "@/components/admin-react/static-admin-design-page";

export const metadata: Metadata = {
  title: "Moso Tea Admin | Notifications",
};

export default async function NotificationsRoutePage() {
  return (
    <StaticAdminDesignPage
      file="stitch/admin_notifications_toasts_desktop/code.html"
      pathname="/notifications"
      withSidebar
    />
  );
}

