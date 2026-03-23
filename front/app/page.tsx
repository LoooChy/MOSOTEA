import type { Metadata } from "next";
import { DesignRenderer } from "@/components/design-renderer";
import { loadDesignDocument } from "@/lib/design-loader";
import { resolveFrontRoute } from "@/lib/design-routes";

export const metadata: Metadata = {
  title: "Moso Tea | MOSO TEA",
};

export default async function HomePage() {
  const homeRoute = resolveFrontRoute("/");
  if (!homeRoute) {
    throw new Error("Homepage route is missing.");
  }
  const document = await loadDesignDocument(homeRoute.file);
  return <DesignRenderer document={document} pathname={homeRoute.path} />;
}
