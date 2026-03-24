import type { Metadata } from "next";
import { StaticDesignPage } from "@/components/front-pages/static-design-page";

export const metadata: Metadata = {
  title: "Tea House | Moso Tea",
};

export default async function TeaHousePage() {
  return <StaticDesignPage file="stitch/contact_us_desktop/code.html" pathname="/tea-house" />;
}

