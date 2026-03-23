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
    const usernameInput = document.querySelector<HTMLInputElement>("#email");
    const passwordInput = document.querySelector<HTMLInputElement>("#password");
    const loginContainer =
      loginControls[0]?.parentElement ??
      document.querySelector<HTMLElement>(".w-full.px-10.pb-12.space-y-8");
    const errorElementId = "moso-admin-login-error";
    let submitting = false;

    const ensureErrorElement = () => {
      if (!loginContainer) {
        return null;
      }
      let element = document.getElementById(errorElementId) as HTMLParagraphElement | null;
      if (!element) {
        element = document.createElement("p");
        element.id = errorElementId;
        element.className = "hidden text-xs text-error font-label tracking-wide px-1";
        loginContainer.appendChild(element);
      }
      return element;
    };

    const setErrorMessage = (message: string | null) => {
      const element = ensureErrorElement();
      const hasError = Boolean(message && message.trim().length > 0);
      [usernameInput, passwordInput].forEach((input) => {
        if (!input) {
          return;
        }
        input.classList.toggle("ring-1", hasError);
        input.classList.toggle("ring-error/40", hasError);
        input.classList.toggle("bg-error-container/50", hasError);
      });
      if (!element) {
        return;
      }
      if (!hasError) {
        element.textContent = "";
        element.classList.add("hidden");
        return;
      }
      element.textContent = message ?? "";
      element.classList.remove("hidden");
    };

    const onLogin = async (event: Event) => {
      event.preventDefault();
      if (submitting) {
        return;
      }
      const username = (usernameInput?.value ?? "").trim();
      const password = (passwordInput?.value ?? "").trim();
      if (username.length === 0 || password.length === 0) {
        setErrorMessage("Please enter account and password.");
        return;
      }
      submitting = true;
      setErrorMessage(null);

      try {
        const response = await fetch("/api/admin/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });
        if (!response.ok) {
          let message = "Invalid account or password.";
          try {
            const data = (await response.json()) as { error?: unknown };
            if (typeof data.error === "string" && data.error.trim().length > 0) {
              message = data.error;
            }
          } catch {
            // Keep fallback error message.
          }
          setErrorMessage(message);
          return;
        }
      } catch {
        setErrorMessage("Unable to login right now. Please try again.");
        return;
      } finally {
        submitting = false;
      }

      markAuthenticated();
      redirectTo(ADMIN_DEFAULT_AUTH_PATH);
    };

    const clearError = () => setErrorMessage(null);

    loginControls.forEach((node) => node.addEventListener("click", onLogin));
    loginForms.forEach((form) => form.addEventListener("submit", onLogin));
    usernameInput?.addEventListener("input", clearError);
    passwordInput?.addEventListener("input", clearError);

    return () => {
      loginControls.forEach((node) => node.removeEventListener("click", onLogin));
      loginForms.forEach((form) => form.removeEventListener("submit", onLogin));
      usernameInput?.removeEventListener("input", clearError);
      passwordInput?.removeEventListener("input", clearError);
    };
  }, [pathname]);

  return null;
}
