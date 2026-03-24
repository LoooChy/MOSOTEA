import type { Metadata } from "next";
import { StaticDesignPage } from "@/components/front-pages/static-design-page";

export const metadata: Metadata = {
  title: "FAQ | Moso Tea",
};

export default async function FaqPage() {
  return <StaticDesignPage file="stitch/refined_faq_desktop/code.html" pathname="/faq" />;
}

