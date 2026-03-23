"use client";

import { useEffect } from "react";

type WorkshopLinkEnhancerProps = {
  pathname: string;
};

type RitualRoute = {
  id: string;
  matcher: RegExp;
  href: string;
};

const RITUAL_ROUTES: RitualRoute[] = [
  {
    id: "ritual-authentic",
    matcher: /authentic tea ceremony/i,
    href: "/workshops#ritual-authentic",
  },
  {
    id: "ritual-brewing",
    matcher: /tradition of tea brewing/i,
    href: "/workshops#ritual-brewing",
  },
  {
    id: "ritual-making",
    matcher: /art of tea making/i,
    href: "/workshops#ritual-making",
  },
];

const QUERY_TARGETS: Record<string, string> = {
  authentic: "ritual-authentic",
  brewing: "ritual-brewing",
  making: "ritual-making",
};

function navigateTo(url: string) {
  window.location.href = url;
}

function matchRitualByTitle(text: string): RitualRoute | null {
  const normalized = text.replace(/\s+/g, " ").trim();
  for (const item of RITUAL_ROUTES) {
    if (item.matcher.test(normalized)) {
      return item;
    }
  }
  return null;
}

function scrollToRitualTarget(id: string) {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function WorkshopLinkEnhancer({ pathname }: WorkshopLinkEnhancerProps) {
  useEffect(() => {
    if (pathname === "/") {
      const ritualsHeading = Array.from(document.querySelectorAll("h2")).find((node) =>
        /the rituals/i.test(node.textContent ?? "")
      ) as HTMLElement | undefined;
      const ritualsSection = ritualsHeading?.closest("section");
      if (!ritualsSection) {
        return;
      }

      const cleanupTasks: Array<() => void> = [];
      const titles = Array.from(ritualsSection.querySelectorAll("h3"));
      titles.forEach((titleNode) => {
        const ritual = matchRitualByTitle(titleNode.textContent ?? "");
        if (!ritual) {
          return;
        }
        const card = titleNode.closest("div.group") as HTMLElement | null;
        if (!card) {
          return;
        }
        card.style.cursor = "pointer";
        card.setAttribute("role", "link");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", `View ${titleNode.textContent?.trim() ?? "workshop"}`);

        const onClick = () => navigateTo(ritual.href);
        const onKeyDown = (event: KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigateTo(ritual.href);
          }
        };

        card.addEventListener("click", onClick);
        card.addEventListener("keydown", onKeyDown);
        cleanupTasks.push(() => {
          card.removeEventListener("click", onClick);
          card.removeEventListener("keydown", onKeyDown);
        });
      });

      return () => {
        cleanupTasks.forEach((cleanup) => cleanup());
      };
    }

    if (pathname === "/workshops" || pathname === "/experience") {
      RITUAL_ROUTES.forEach((ritual) => {
        const heading = Array.from(document.querySelectorAll("h2")).find((node) =>
          ritual.matcher.test(node.textContent ?? "")
        ) as HTMLElement | undefined;
        const section = heading?.closest("section");
        if (!section) {
          return;
        }
        section.id = ritual.id;
        section.style.scrollMarginTop = "120px";
      });

      const fromHash = window.location.hash.replace(/^#/, "").trim();
      const queryValue = new URLSearchParams(window.location.search).get("ritual") ?? "";
      const fromQuery = QUERY_TARGETS[queryValue.trim().toLowerCase()] ?? "";
      const targetId = fromHash || fromQuery;
      if (targetId) {
        window.requestAnimationFrame(() => {
          scrollToRitualTarget(targetId);
        });
      }
    }
  }, [pathname]);

  return null;
}
