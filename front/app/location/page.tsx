import type { Metadata } from "next";
import { StaticDesignPage } from "@/components/front-pages/static-design-page";

export const metadata: Metadata = {
  title: "Location | Moso Tea",
};

export default async function LocationPage() {
  return <StaticDesignPage file="stitch/contact_us_desktop/code.html" pathname="/location" />;
}

