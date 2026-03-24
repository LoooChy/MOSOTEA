import type { Metadata } from "next";
import { StaticDesignPage } from "@/components/front-pages/static-design-page";

export const metadata: Metadata = {
  title: "About Us | Moso Tea",
};

export default async function AboutPage() {
  return <StaticDesignPage file="stitch/about_us_desktop/code.html" pathname="/about" />;
}

