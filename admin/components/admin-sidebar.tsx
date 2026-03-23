"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { ADMIN_SIDEBAR_CONFIG, AdminSidebarItem } from "@/lib/admin-sidebar-config";
import { ADMIN_AUTH_COOKIE_KEY, ADMIN_AUTH_STORAGE_KEY } from "@/lib/admin-auth";

type AdminSidebarProps = {
  pathname: string;
};

function isActive(
  pathname: string,
  item: AdminSidebarItem
): boolean {
  if (pathname === item.href) {
    return true;
  }
  if (!item.matchPrefixes || item.matchPrefixes.length === 0) {
    return false;
  }
  return item.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function AdminSidebar({ pathname }: AdminSidebarProps) {
  const onLogout = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    document.cookie = `${ADMIN_AUTH_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
    window.location.replace("/login");
  };
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 bg-[#f6f3ee] border-r border-[#1c1c19]/10 z-40 flex-col py-8">
      <div className="px-8 mb-8">
        <h1 className="font-headline text-primary text-lg tracking-tight">{ADMIN_SIDEBAR_CONFIG.title}</h1>
        <p className="text-on-surface-variant/60 text-xs mt-1">{ADMIN_SIDEBAR_CONFIG.subtitle}</p>
      </div>
      <nav className="flex-1 space-y-1">
        {ADMIN_SIDEBAR_CONFIG.mainItems.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={
                active
                  ? "flex items-center px-6 py-3 mx-2 bg-[#17341c] text-white rounded-xl shadow-sm transition-transform duration-300 hover:translate-x-1"
                  : "flex items-center px-6 py-3 mx-2 text-[#1c1c19]/70 hover:bg-[#ebe8e3] rounded-xl transition-transform duration-300 hover:translate-x-1"
              }
            >
              <span className="material-symbols-outlined mr-3">{item.icon}</span>
              <span className="font-label text-sm tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="pt-4 border-t border-outline-variant/20 mt-auto px-4">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center px-6 py-3 mx-2 text-left text-[#1c1c19]/70 hover:bg-[#ebe8e3] rounded-xl transition-transform duration-300 hover:translate-x-1"
        >
          <span className="material-symbols-outlined mr-3">logout</span>
          <span className="font-label text-sm tracking-tight">注销</span>
        </button>
      </div>
    </aside>
  );
}
