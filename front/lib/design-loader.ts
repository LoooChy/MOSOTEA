import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

const DEFAULT_RADIUS = {
  DEFAULT: "0.25rem",
  lg: "0.5rem",
  xl: "0.75rem",
  full: "9999px",
} as const;

type RadiusKey = keyof typeof DEFAULT_RADIUS;

export type DesignDocument = {
  bodyClass: string;
  bodyHtml: string;
  styles: string[];
  pageTitle: string | null;
  radiusOverrideCss: string;
};

const FRONT_HREF_REWRITE: Record<string, string> = {
  "#about": "/about",
  "#workshops": "/workshops",
  "#location": "/location",
  "#faq": "/faq",
};

const FRONT_ANCHOR_TEXT_TARGETS: Array<{ needles: string[]; target: string }> = [
  { needles: ["about"], target: "/about" },
  { needles: ["our story", "origins"], target: "/our-story" },
  { needles: ["workshops", "experience", "rituals", "collections"], target: "/workshops" },
  { needles: ["location", "the tea house", "our gardens"], target: "/location" },
  { needles: ["the shop"], target: "/workshops" },
  { needles: ["faq", "journal"], target: "/faq" },
  { needles: ["admin"], target: "/" },
  { needles: ["booking", "ceremony"], target: "/booking/calendar" },
  { needles: ["try another date"], target: "/booking/calendar" },
  { needles: ["contact us", "contact"], target: "/contact" },
  { needles: ["return home"], target: "/" },
];

const FRONT_BUTTON_TEXT_TARGETS: Array<{ needles: string[]; target: string }> = [
  { needles: ["book now", "book ceremony", "book this experience", "book a workshop", "reserve now", "reserve your place"], target: "/booking/calendar" },
  { needles: ["explore our workshops"], target: "/workshops" },
  { needles: ["continue to guest info"], target: "/booking/validate" },
  { needles: ["proceed to confirmation"], target: "/booking/confirm" },
  { needles: ["confirm booking"], target: "/booking/success" },
  { needles: ["notify me"], target: "/contact" },
  { needles: ["return home"], target: "/" },
];

function extractFirst(pattern: RegExp, source: string): string | null {
  return source.match(pattern)?.[1]?.trim() ?? null;
}

function extractBody(html: string): { bodyClass: string; bodyHtml: string } {
  const bodyMatch = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) {
    return { bodyClass: "", bodyHtml: html };
  }
  const attrs = bodyMatch[1] ?? "";
  const bodyClass = attrs.match(/class=["']([^"']+)["']/i)?.[1] ?? "";
  return {
    bodyClass,
    bodyHtml: bodyMatch[2]?.trim() ?? "",
  };
}

function extractStyles(html: string): string[] {
  const styleMatches = Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi));
  return styleMatches.map((match) => match[1]?.trim() ?? "").filter(Boolean);
}

function extractRadius(script: string, key: RadiusKey): string | null {
  const match = script.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));
  return match?.[1] ?? null;
}

function buildRadiusOverrideCss(html: string): string {
  const script = extractFirst(/<script[^>]*id=["']tailwind-config["'][^>]*>([\s\S]*?)<\/script>/i, html);
  if (!script) {
    return "";
  }
  const radius: Record<RadiusKey, string> = {
    DEFAULT: extractRadius(script, "DEFAULT") ?? DEFAULT_RADIUS.DEFAULT,
    lg: extractRadius(script, "lg") ?? DEFAULT_RADIUS.lg,
    xl: extractRadius(script, "xl") ?? DEFAULT_RADIUS.xl,
    full: extractRadius(script, "full") ?? DEFAULT_RADIUS.full,
  };

  const overrides: string[] = [];
  if (radius.DEFAULT !== DEFAULT_RADIUS.DEFAULT) {
    overrides.push(`.rounded{border-radius:${radius.DEFAULT};}`);
  }
  if (radius.lg !== DEFAULT_RADIUS.lg) {
    overrides.push(`.rounded-lg{border-radius:${radius.lg};}`);
  }
  if (radius.xl !== DEFAULT_RADIUS.xl) {
    overrides.push(`.rounded-xl{border-radius:${radius.xl};}`);
  }
  if (radius.full !== DEFAULT_RADIUS.full) {
    overrides.push(`.rounded-full{border-radius:${radius.full};}`);
  }
  return overrides.join("\n");
}

function normalizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function resolveByText(
  text: string,
  rules: Array<{ needles: string[]; target: string }>
): string | null {
  for (const rule of rules) {
    if (rule.needles.some((needle) => text === needle || text.includes(needle))) {
      return rule.target;
    }
  }
  return null;
}

function rewriteFrontAnchors(bodyHtml: string): string {
  return bodyHtml.replace(
    /<a\b([^>]*?)href=["']([^"']*)["']([^>]*)>([\s\S]*?)<\/a>/gi,
    (full, beforeHref, rawHref, afterHref, innerHtml) => {
      const href = String(rawHref || "").trim();
      const normalized = normalizeText(String(innerHtml || ""));
      const fromHash = FRONT_HREF_REWRITE[href];
      const fromText =
        href === "#" || href.length === 0
          ? resolveByText(normalized, FRONT_ANCHOR_TEXT_TARGETS)
          : null;
      const nextHref = fromHash ?? fromText;
      if (!nextHref) {
        return full;
      }
      return `<a${beforeHref}href="${nextHref}"${afterHref}>${innerHtml}</a>`;
    }
  );
}

function rewriteFrontButtons(bodyHtml: string): string {
  const ensureClassTokens = (attrs: string, tokens: string[]) => {
    const classMatch = attrs.match(/\sclass=["']([^"']*)["']/i);
    if (!classMatch) {
      return `${attrs} class="${tokens.join(" ")}"`;
    }
    const existing = classMatch[1];
    const missing = tokens.filter((token) => !new RegExp(`(^|\\s)${token}(\\s|$)`).test(existing));
    if (missing.length === 0) {
      return attrs;
    }
    return attrs.replace(classMatch[0], ` class="${existing} ${missing.join(" ")}"`);
  };

  return bodyHtml.replace(
    /<button\b([^>]*)>([\s\S]*?)<\/button>/gi,
    (full, attrs, innerHtml) => {
      const normalized = normalizeText(String(innerHtml || ""));
      const target = resolveByText(normalized, FRONT_BUTTON_TEXT_TARGETS);
      if (!target) {
        return full;
      }
      const withoutType = String(attrs || "").replace(/\stype=["'][^"']*["']/gi, "");
      const safeAttrs = ensureClassTokens(withoutType, ["inline-block", "text-center"]);
      return `<a${safeAttrs} href="${target}" role="button">${innerHtml}</a>`;
    }
  );
}

function rewriteFrontNavigation(bodyHtml: string): string {
  return rewriteFrontButtons(rewriteFrontAnchors(bodyHtml));
}

function rewriteWorkshopExperienceLinks(
  bodyHtml: string,
  relativeHtmlPath: string
): string {
  if (!relativeHtmlPath.includes("workshops_listing")) {
    return bodyHtml;
  }
  const targets = [
    "/booking/calendar?experience=authentic",
    "/booking/calendar?experience=brewing",
    "/booking/calendar?experience=making",
  ];
  let index = 0;
  return bodyHtml.replace(
    /<a\b([^>]*?)href=["'][^"']*["']([^>]*)>([\s\S]*?)<\/a>/gi,
    (full, beforeHref, afterHref, innerHtml) => {
      if (index >= targets.length) {
        return full;
      }
      if (!/book this experience/i.test(normalizeText(String(innerHtml || "")))) {
        return full;
      }
      const target = targets[index];
      index += 1;
      return `<a${beforeHref}href="${target}"${afterHref}>${innerHtml}</a>`;
    }
  );
}

function stripEmbeddedTopNav(bodyHtml: string): string {
  const mainIndex = bodyHtml.search(/<main\b/i);
  const scanEnd = mainIndex >= 0 ? mainIndex : bodyHtml.length;
  const preMain = bodyHtml.slice(0, scanEnd);
  const match = preMain.match(/<(header|nav)\b[\s\S]*?<\/\1>/i);
  if (!match || match.index === undefined) {
    return bodyHtml;
  }
  const start = match.index;
  const end = start + match[0].length;
  return `${bodyHtml.slice(0, start)}${bodyHtml.slice(end)}`;
}

export const loadDesignDocument = cache(async (relativeHtmlPath: string): Promise<DesignDocument> => {
  const absolutePath = path.join(process.cwd(), relativeHtmlPath);
  const html = await fs.readFile(absolutePath, "utf8");
  const { bodyClass, bodyHtml } = extractBody(html);
  const bodyWithoutTopNav = stripEmbeddedTopNav(bodyHtml);
  const rewrittenBodyHtml = rewriteWorkshopExperienceLinks(
    rewriteFrontNavigation(bodyWithoutTopNav),
    relativeHtmlPath
  );
  const styles = extractStyles(html);
  const pageTitle = extractFirst(/<title>([\s\S]*?)<\/title>/i, html);
  const radiusOverrideCss = buildRadiusOverrideCss(html);

  return {
    bodyClass,
    bodyHtml: rewrittenBodyHtml,
    styles,
    pageTitle,
    radiusOverrideCss,
  };
});
