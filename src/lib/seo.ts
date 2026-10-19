export const SITE = {
  name: "LightCMS",
  origin: "https://lightcms.me",
  locale: "en_US",
  repository: "https://github.com/light-cms/lightcms",
  contactEmail: "lightcms@zohomail.in",
  contactFormUrl: "https://app.youform.com/forms/smwrhikc",
  sponsorUrl: "https://upi.pratyay.online",
  blogUrl: "https://light-cms.github.io",
} as const;

export const HOME_TITLE = `${SITE.name} | Git backed CMS for static site generators`;

export const ABOUT_TITLE = `About ${SITE.name} | A simple, Git backed headless CMS`;

export const PRIVACY_TITLE = `Privacy Policy | ${SITE.name}`;

export const DOCS_TITLE = `Documentation | ${SITE.name}`;

export const HOME_DESCRIPTION =
  "LightCMS is a Git-backed content workspace for editing and publishing markdown.";

export const ABOUT_DESCRIPTION =
  "Learn how LightCMS works: a focused, fast CMS that stores every post as markdown in your own GitHub repository, with an access model Git already provides.";

export const PRIVACY_DESCRIPTION =
  "How LightCMS collects, uses, and protects your account, authentication, and GitHub repository access data.";

export const DOCS_DESCRIPTION =
  "Local LightCMS documentation: connect a repository, organize collections, edit markdown, and publish without leaving the app.";

export const DEFAULT_OG_IMAGE = "/og-image.png";

/** Structured data a page contributes on top of the site-wide defaults. */
export type PageSeoOverride = {
  title?: string;
  description?: string;
  type?: "website" | "article";
  image?: string;
  imageAlt?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export type PageSeo = Omit<PageSeoOverride, "jsonLd"> & {
  title: string;
  description: string;
  type: "website" | "article";
  image: string;
  imageAlt: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

type RouteDefaults = { title: string; description: string };

const ROUTE_DEFAULTS: Record<string, RouteDefaults> = {
  "/": { title: HOME_TITLE, description: HOME_DESCRIPTION },
  "/about": { title: ABOUT_TITLE, description: ABOUT_DESCRIPTION },
  "/privacy": { title: PRIVACY_TITLE, description: PRIVACY_DESCRIPTION },
  "/docs": { title: DOCS_TITLE, description: DOCS_DESCRIPTION },
};

const FALLBACK: RouteDefaults = {
  title: SITE.name,
  description: HOME_DESCRIPTION,
};

export const NOINDEX_PREFIXES: readonly string[] = ["/auth", "/signout", "/cms"];

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.replace(/\/+$/, "");
  }

  return pathname;
}

export function isNoindexPath(pathname: string): boolean {
  const path = normalizePathname(pathname);

  return NOINDEX_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function resolvePageSeo(pathname: string, override: PageSeoOverride = {}): PageSeo {
  const base = ROUTE_DEFAULTS[normalizePathname(pathname)] ?? FALLBACK;
  const title = override.title ?? base.title;

  return {
    title,
    description: override.description ?? base.description,
    type: override.type ?? "website",
    image: override.image ?? DEFAULT_OG_IMAGE,
    imageAlt: override.imageAlt ?? `${SITE.name} — ${title}`,
    ...(override.jsonLd === undefined ? {} : { jsonLd: override.jsonLd }),
  };
}

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, SITE.origin).href;
}

export function canonicalPathname(url: URL): string {
  return normalizePathname(url.pathname);
}
