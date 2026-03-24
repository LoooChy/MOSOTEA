"use client";

import { CSSProperties, useEffect, useState } from "react";
import Link from "next/link";
import { FrontNavConfig, FrontNavItem } from "@/lib/front-nav-config";

type FrontNavBarProps = {
  pathname: string;
  config: FrontNavConfig;
};

function isActive(pathname: string, item: FrontNavItem): boolean {
  if (pathname === item.href) {
    return true;
  }
  if (!item.matchPrefixes || item.matchPrefixes.length === 0) {
    return false;
  }
  return item.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function FrontNavBar({ pathname, config }: FrontNavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isBookingPath = pathname.startsWith("/booking");
  const headerStyle: CSSProperties = isBookingPath
    ? {
        top: "max(env(safe-area-inset-top), 0px)",
        transform: "translate3d(0,0,0)",
        WebkitTransform: "translate3d(0,0,0)",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }
    : {
        top: "max(env(safe-area-inset-top), 0px)",
      };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={headerStyle}>
      <nav className="flex justify-between items-center w-full px-6 md:px-12 py-6 mx-auto bg-[#fcf9f4]/80 backdrop-blur-xl shadow-[0_40px_40px_rgba(28,28,25,0.06)]">
        <Link className="text-2xl font-serif italic tracking-tight text-primary" href={config.brandHref}>
          {config.brandLabel}
        </Link>
        <div className="hidden md:flex items-center gap-10 font-['Noto_Serif'] tracking-tight text-sm uppercase">
          {config.items.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                className={
                  active
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-on-surface/60 hover:text-primary transition-colors duration-500"
                }
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-outline-variant/30 bg-surface-container-low text-primary"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span className="material-symbols-outlined">
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
          {config.showUtilityIcons ? (
            <>
              <span className="material-symbols-outlined hidden md:block text-primary" aria-hidden>
                notifications
              </span>
              <span className="material-symbols-outlined hidden md:block text-primary" aria-hidden>
                account_circle
              </span>
            </>
          ) : null}
          {config.cta ? (
            <Link
              className="hidden md:inline-flex bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-full font-label font-semibold text-sm uppercase tracking-wide hover:opacity-90 active:scale-95 transition-all duration-500"
              href={config.cta.href}
            >
              {config.cta.label}
            </Link>
          ) : null}
        </div>
      </nav>
      {mobileOpen ? (
        <div className="md:hidden bg-[#fcf9f4]/95 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0_20px_40px_rgba(28,28,25,0.08)] px-6 pb-6">
          <div className="flex flex-col gap-1 pt-4">
            {config.items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Link
                  key={`mobile-${item.href}`}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={
                    active
                      ? "rounded-xl px-4 py-3 bg-primary text-on-primary font-['Noto_Serif'] text-sm uppercase tracking-tight"
                      : "rounded-xl px-4 py-3 text-on-surface/80 font-['Noto_Serif'] text-sm uppercase tracking-tight hover:bg-surface-container-low transition-colors"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          {config.cta ? (
            <Link
              href={config.cta.href}
              onClick={closeMobileMenu}
              className="mt-4 inline-flex w-full items-center justify-center bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-full font-label font-semibold text-sm uppercase tracking-wide hover:opacity-90 active:scale-95 transition-all duration-500"
            >
              {config.cta.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
