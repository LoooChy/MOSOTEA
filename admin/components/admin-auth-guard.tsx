"use client";

import { useEffect } from "react";
import { ADMIN_DEFAULT_AUTH_PATH } from "@/lib/design-routes";
import { ADMIN_AUTH_COOKIE_KEY, ADMIN_AUTH_STORAGE_KEY } from "@/lib/admin-auth";

type AdminAuthGuardProps = {
  pathname: string;
};

function isAuthenticated(): boolean {
  return window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === "1";
}

function redirectTo(pathname: string) {
  if (window.location.pathname === pathname) {
    return;
  }
  window.location.replace(pathname);
}

export function AdminAuthGuard({ pathname }: AdminAuthGuardProps) {
  useEffect(() => {
    const isPublicPath = pathname === "/" || pathname === "/login";

    const enforceRouteAccess = (): boolean => {
      const authenticated = isAuthenticated();
      if (isPublicPath) {
        if (authenticated) {
          redirectTo(ADMIN_DEFAULT_AUTH_PATH);
          return false;
        }
        return true;
      }
      if (!authenticated) {
        redirectTo("/login");
        return false;
      }
      return true;
    };

    enforceRouteAccess();

    if (isPublicPath) {
      return;
    }

    const onPageShow = () => {
      enforceRouteAccess();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [pathname]);

  useEffect(() => {
    if (isAuthenticated()) {
      document.cookie = `${ADMIN_AUTH_COOKIE_KEY}=1; Path=/; Max-Age=2592000; SameSite=Lax`;
    }
  }, []);

  return null;
}
