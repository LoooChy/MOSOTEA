export type AdminSidebarItem = {
  label: string;
  href: string;
  icon: string;
  matchPrefixes?: string[];
};

export type AdminSidebarConfig = {
  title: string;
  subtitle: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  mainItems: AdminSidebarItem[];
  secondaryItems: AdminSidebarItem[];
};

export const ADMIN_SIDEBAR_CONFIG: AdminSidebarConfig = {
  title: "Tea Master Admin",
  subtitle: "Managing the Ritual",
  primaryActionLabel: "New Session",
  primaryActionHref: "/bookings",
  mainItems: [
    // { label: "Dashboard", href: "/dashboard", icon: "dashboard", matchPrefixes: ["/dashboard"] },
    // { label: "Sessions", href: "/sessions", icon: "temp_preferences_custom", matchPrefixes: ["/sessions"] },
    { label: "Bookings", href: "/bookings", icon: "event_available", matchPrefixes: ["/bookings"] },
    { label: "Customers", href: "/customers", icon: "group", matchPrefixes: ["/customers"] },
    // { label: "Content", href: "/content", icon: "edit_note", matchPrefixes: ["/content"] },
    // { label: "Notifications", href: "/notifications", icon: "notifications", matchPrefixes: ["/notifications"] },
    // { label: "Orders", href: "/orders", icon: "package_2", matchPrefixes: ["/orders"] },
  ],
  secondaryItems: [
    // { label: "Settings", href: "/dashboard", icon: "settings" },
    // { label: "Support", href: "/dashboard", icon: "help_outline" },
  ],
};
