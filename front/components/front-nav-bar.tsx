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
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
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
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-full font-label font-semibold text-sm uppercase tracking-wide hover:opacity-90 active:scale-95 transition-all duration-500"
              href={config.cta.href}
            >
              {config.cta.label}
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
