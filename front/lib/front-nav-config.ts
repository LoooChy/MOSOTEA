export type FrontNavItem = {
  label: string;
  href: string;
  matchPrefixes?: string[];
};

export type FrontNavConfig = {
  brandLabel: string;
  brandHref: string;
  items: FrontNavItem[];
  cta?: {
    label: string;
    href: string;
  };
  showUtilityIcons?: boolean;
};

const marketingItems: FrontNavItem[] = [
  { label: "Home", href: "/" },
  { label: "Workshops", href: "/workshops", matchPrefixes: ["/workshops", "/experience"] },
  { label: "About", href: "/about", matchPrefixes: ["/about", "/our-story"] },
  { label: "FAQ", href: "/faq", matchPrefixes: ["/faq"] },
  { label: "Booking", href: "/booking/calendar", matchPrefixes: ["/booking"] },
];

const sharedConfig: FrontNavConfig = {
  brandLabel: "MOSO TEA",
  brandHref: "/",
  items: marketingItems,
  cta: {
    label: "Book Now",
    href: "/booking/calendar",
  },
  showUtilityIcons: false,
};

const BOOKING_FLOW_PATHS = new Set([
  "/booking/calendar",
  "/booking/validate",
  "/booking/confirm",
  "/booking/success",
]);

export function resolveFrontNavConfig(pathname: string): FrontNavConfig {
  if (BOOKING_FLOW_PATHS.has(pathname)) {
    return {
      ...sharedConfig,
      cta: undefined,
    };
  }
  return sharedConfig;
}
