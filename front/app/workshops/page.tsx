import type { Metadata } from "next";
import { StaticDesignPage } from "@/components/front-pages/static-design-page";

export const metadata: Metadata = {
  title: "Workshops | Moso Tea",
};

export default async function WorkshopsPage() {
  return <StaticDesignPage file="stitch/workshops_listing/code.html" pathname="/workshops" />;
}

