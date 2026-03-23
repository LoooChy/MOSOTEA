export type DesignRoute = {
  path: string;
  file: string;
  label: string;
  layout: "public" | "admin";
};

export const ADMIN_DEFAULT_AUTH_PATH = "/bookings";

export const ADMIN_ROUTES: DesignRoute[] = [
  { path: "/", file: "stitch/admin_login_desktop/code.html", label: "Moso Tea Admin | Login", layout: "public" },
  { path: "/login", file: "stitch/admin_login_desktop/code.html", label: "Moso Tea Admin | Login", layout: "public" },
  { path: "/dashboard", file: "stitch/admin_booking_overview/code.html", label: "Moso Tea Admin | Dashboard", layout: "admin" },
  { path: "/bookings", file: "stitch/admin_booking_overview/code.html", label: "Moso Tea Admin | Bookings", layout: "admin" },
  { path: "/sessions", file: "stitch/admin_booking_overview/code.html", label: "Moso Tea Admin | Sessions", layout: "admin" },
  { path: "/bookings/detail", file: "stitch/admin_booking_details_customer_profile/code.html", label: "Moso Tea Admin | Booking Detail", layout: "admin" },
  { path: "/bookings/customers", file: "stitch/admin_customer_directory/code.html", label: "Moso Tea Admin | Booking Customers", layout: "admin" },
  { path: "/customers", file: "stitch/admin_customer_directory/code.html", label: "Moso Tea Admin | Customers", layout: "admin" },
  { path: "/history", file: "stitch/admin_booking_overview/code.html", label: "Moso Tea Admin | History", layout: "admin" },
  { path: "/content", file: "stitch/admin_content_management/code.html", label: "Moso Tea Admin | Content", layout: "admin" },
  { path: "/notifications", file: "stitch/admin_notifications_toasts_desktop/code.html", label: "Moso Tea Admin | Notifications", layout: "admin" },
  { path: "/orders", file: "stitch/admin_booking_overview/code.html", label: "Moso Tea Admin | Orders", layout: "admin" },
];

const routeMap = new Map(ADMIN_ROUTES.map((route) => [route.path, route]));

export function resolveAdminRoute(pathname: string): DesignRoute | null {
  return routeMap.get(pathname) ?? null;
}

export function toPathname(slug?: string[]): string {
  if (!slug || slug.length === 0) {
    return "/";
  }
  return `/${slug.join("/")}`;
}
