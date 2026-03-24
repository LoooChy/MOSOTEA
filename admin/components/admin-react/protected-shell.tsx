"use client";

import { ReactNode, useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ADMIN_AUTH_STORAGE_KEY } from "@/lib/admin-auth";

type ProtectedShellProps = {
  pathname: string;
  children: ReactNode;
};

function isAuthenticated(): boolean {
  return window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === "1";
}

export function ProtectedShell({ pathname, children }: ProtectedShellProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const enforceAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        setReady(false);
        window.location.replace("/login");
        return;
      }
      if (active) {
        setReady(true);
      }
    };

    enforceAuth();
    const onPageShow = () => enforceAuth();
    window.addEventListener("pageshow", onPageShow);
    return () => {
      active = false;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen relative">
      <div className="fixed inset-0 bg-grain pointer-events-none z-0" />
      <div className="relative z-10 flex min-h-screen">
        <AdminSidebar pathname={pathname} />
        <main className="flex-1 p-8 lg:p-12 z-10 max-w-[1440px] mx-auto w-full lg:pl-72">
          {children}
        </main>
      </div>
    </div>
  );
}

