import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { ADMIN_DEFAULT_AUTH_PATH } from "@/lib/design-routes";

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

const ADMIN_ANCHOR_TEXT_TARGETS: Array<{ needles: string[]; target: string }> = [
  { needles: ["dashboard"], target: "/dashboard" },
  { needles: ["sessions"], target: "/sessions" },
  { needles: ["bookings"], target: "/bookings" },
  { needles: ["customers"], target: "/customers" },
  { needles: ["content management", "content"], target: "/content" },
  { needles: ["notifications", "journal"], target: "/notifications" },
  { needles: ["orders"], target: "/orders" },
  { needles: ["analytics"], target: "/notifications" },
  { needles: ["settings", "support"], target: "/dashboard" },
];

const ADMIN_BUTTON_TEXT_TARGETS: Array<{ needles: string[]; target: string }> = [
  { needles: ["enter sanctuary", "sign in", "log in", "login"], target: ADMIN_DEFAULT_AUTH_PATH },
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

function rewriteAdminAnchors(bodyHtml: string): string {
  return bodyHtml.replace(
    /<a\b([^>]*?)href=["']([^"']*)["']([^>]*)>([\s\S]*?)<\/a>/gi,
    (full, beforeHref, rawHref, afterHref, innerHtml) => {
      const href = String(rawHref || "").trim();
      if (href !== "#" && href.length > 0) {
        return full;
      }
      const normalized = normalizeText(String(innerHtml || ""));
      const target = resolveByText(normalized, ADMIN_ANCHOR_TEXT_TARGETS);
      if (!target) {
        return full;
      }
      return `<a${beforeHref}href="${target}"${afterHref}>${innerHtml}</a>`;
    }
  );
}

function rewriteAdminButtons(bodyHtml: string): string {
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
      const target = resolveByText(normalized, ADMIN_BUTTON_TEXT_TARGETS);
      if (!target) {
        return full;
      }
      const withoutType = String(attrs || "").replace(/\stype=["'][^"']*["']/gi, "");
      const safeAttrs = ensureClassTokens(withoutType, ["block", "text-center"]);
      return `<a${safeAttrs} href="${target}" role="button">${innerHtml}</a>`;
    }
  );
}

function stripEmbeddedSidebar(bodyHtml: string): string {
  return bodyHtml.replace(/<aside\b[\s\S]*?<\/aside>/i, "");
}

export const loadDesignDocument = cache(async (relativeHtmlPath: string, useAdminShell: boolean): Promise<DesignDocument> => {
  const absolutePath = path.join(process.cwd(), relativeHtmlPath);
  const html = await fs.readFile(absolutePath, "utf8");
  const { bodyClass, bodyHtml } = extractBody(html);
  const withoutStaticSidebar = useAdminShell ? stripEmbeddedSidebar(bodyHtml) : bodyHtml;
  const rewrittenBodyHtml = rewriteAdminButtons(rewriteAdminAnchors(withoutStaticSidebar));
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
