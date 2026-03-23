export type DesignRoute = {
  path: string;
  file: string;
  label: string;
};

export const FRONT_ROUTES: DesignRoute[] = [
  { path: "/", file: "stitch/moso_tea_homepage/code.html", label: "Moso Tea | MOSO TEA" },
  { path: "/about", file: "stitch/about_us_desktop/code.html", label: "About Us | Moso Tea" },
  { path: "/our-story", file: "stitch/about_us_desktop/code.html", label: "Our Story | Moso Tea" },
  { path: "/workshops", file: "stitch/workshops_listing/code.html", label: "Workshops | Moso Tea" },
  { path: "/experience", file: "stitch/workshops_listing/code.html", label: "Experience | Moso Tea" },
  { path: "/contact", file: "stitch/contact_us_desktop/code.html", label: "Contact Us | Moso Tea" },
  { path: "/location", file: "stitch/contact_us_desktop/code.html", label: "Location | Moso Tea" },
  { path: "/tea-house", file: "stitch/contact_us_desktop/code.html", label: "Tea House | Moso Tea" },
  { path: "/faq", file: "stitch/refined_faq_desktop/code.html", label: "FAQ | Moso Tea" },
  { path: "/booking/calendar", file: "stitch/booking_calendar_date_selection/code.html", label: "Booking Calendar | Moso Tea" },
  { path: "/booking", file: "stitch/booking_calendar_date_selection/code.html", label: "Booking | Moso Tea" },
  { path: "/booking/confirm", file: "stitch/booking_confirmation/code.html", label: "Booking Confirmation | Moso Tea" },
  { path: "/booking/validate", file: "stitch/booking_validation_feedback_desktop/code.html", label: "Booking Validation | Moso Tea" },
  { path: "/booking/full", file: "stitch/booking_error_full_capacity_desktop/code.html", label: "Session Full | Moso Tea" },
  { path: "/booking/success", file: "stitch/booking_success_desktop/code.html", label: "Booking Success | Moso Tea" },
  { path: "/booking/loading", file: "stitch/loading_state_preparing_ritual_desktop/code.html", label: "Preparing Ritual | Moso Tea" },
];

const routeMap = new Map(FRONT_ROUTES.map((route) => [route.path, route]));

export function resolveFrontRoute(pathname: string): DesignRoute | null {
  return routeMap.get(pathname) ?? null;
}

export function toPathname(slug?: string[]): string {
  if (!slug || slug.length === 0) {
    return "/";
  }
  return `/${slug.join("/")}`;
}
