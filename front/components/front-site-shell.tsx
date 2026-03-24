import { ReactNode } from "react";
import { FrontNavBar } from "@/components/front-nav-bar";
import { resolveFrontNavConfig } from "@/lib/front-nav-config";

type FrontSiteShellProps = {
  pathname: string;
  children: ReactNode;
  contentClassName?: string;
};

export function FrontSiteShell({
  pathname,
  children,
  contentClassName = "",
}: FrontSiteShellProps) {
  const navConfig = resolveFrontNavConfig(pathname);
  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <FrontNavBar pathname={pathname} config={navConfig} />
      <main className={contentClassName}>{children}</main>
    </div>
  );
}

