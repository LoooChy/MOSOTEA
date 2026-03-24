import type { Metadata } from "next";
import { StaticDesignPage } from "@/components/front-pages/static-design-page";

export const metadata: Metadata = {
  title: "Preparing Ritual | Moso Tea",
};

export default async function BookingLoadingPage() {
  return (
    <StaticDesignPage
      file="stitch/loading_state_preparing_ritual_desktop/code.html"
      pathname="/booking/loading"
    />
  );
}

