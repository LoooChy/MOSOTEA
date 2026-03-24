import type { Metadata } from "next";
import { StaticDesignPage } from "@/components/front-pages/static-design-page";

export const metadata: Metadata = {
  title: "Experience | Moso Tea",
};

export default async function ExperiencePage() {
  return <StaticDesignPage file="stitch/workshops_listing/code.html" pathname="/experience" />;
}

