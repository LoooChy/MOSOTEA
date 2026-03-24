import type { Metadata } from "next";
import { StaticDesignPage } from "@/components/front-pages/static-design-page";

export const metadata: Metadata = {
  title: "Contact Us | Moso Tea",
};

export default async function ContactPage() {
  return <StaticDesignPage file="stitch/contact_us_desktop/code.html" pathname="/contact" />;
}

