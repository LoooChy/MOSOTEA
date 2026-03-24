import type { Metadata } from "next";
import { StaticAdminDesignPage } from "@/components/admin-react/static-admin-design-page";

export const metadata: Metadata = {
  title: "Moso Tea Admin | Content",
};

export default async function ContentRoutePage() {
  return (
    <StaticAdminDesignPage
      file="stitch/admin_content_management/code.html"
      pathname="/content"
      withSidebar
    />
  );
}

