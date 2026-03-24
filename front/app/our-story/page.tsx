import type { Metadata } from "next";
import { StaticDesignPage } from "@/components/front-pages/static-design-page";

export const metadata: Metadata = {
  title: "Our Story | Moso Tea",
};

export default async function OurStoryPage() {
  return <StaticDesignPage file="stitch/about_us_desktop/code.html" pathname="/our-story" />;
}

