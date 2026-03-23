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

function markAuthenticated() {
  window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "1");
  document.cookie = `${ADMIN_AUTH_COOKIE_KEY}=1; Path=/; Max-Age=2592000; SameSite=Lax`;
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

    const enforceRouteAccess = () => {
      const authenticated = isAuthenticated();
      if (isPublicPath) {
        if (authenticated) {
          redirectTo(ADMIN_DEFAULT_AUTH_PATH);
        }
        return;
      }
      if (!authenticated) {
        redirectTo("/login");
      }
    };

    enforceRouteAccess();

    if (!isPublicPath) {
      const onPageShow = () => {
        enforceRouteAccess();
      };
      window.addEventListener("pageshow", onPageShow);
      return () => {
        window.removeEventListener("pageshow", onPageShow);
      };
    }

    const loginControls = Array.from(
      document.querySelectorAll<HTMLElement>("a[role='button'], a, button")
    ).filter((node) => /enter sanctuary|sign in|log in|login/i.test(node.textContent ?? ""));
    const loginForms = Array.from(document.querySelectorAll("form"));

    const onLogin = (event: Event) => {
      event.preventDefault();
      markAuthenticated();
      redirectTo(ADMIN_DEFAULT_AUTH_PATH);
    };

    loginControls.forEach((node) => node.addEventListener("click", onLogin));
    loginForms.forEach((form) => form.addEventListener("submit", onLogin));

    return () => {
      loginControls.forEach((node) => node.removeEventListener("click", onLogin));
      loginForms.forEach((form) => form.removeEventListener("submit", onLogin));
    };
  }, [pathname]);

  return null;
}
