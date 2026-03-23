import type { Metadata } from "next";
import { DesignRenderer } from "@/components/design-renderer";
import { loadDesignDocument } from "@/lib/design-loader";
import { resolveAdminRoute } from "@/lib/design-routes";

export const metadata: Metadata = {
  title: "Moso Tea Admin | Login",
};

export default async function HomePage() {
  const homeRoute = resolveAdminRoute("/");
  if (!homeRoute) {
    throw new Error("Admin homepage route is missing.");
  }
  const withSidebar = homeRoute.layout === "admin";
  const document = await loadDesignDocument(homeRoute.file, withSidebar);
  return (
    <DesignRenderer
      document={document}
      pathname={homeRoute.path}
      withSidebar={withSidebar}
    />
  );
}
