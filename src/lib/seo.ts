import type { Metadata } from "next";

export const SITE_URL = "https://doonmeet.in";
export const SITE_NAME = "DoonMeet";

// Served by app/opengraph-image.tsx. Pages that define their own `openGraph`
// / `twitter` objects replace the parent's, so they must reference it
// explicitly or they end up with no share image at all.
export const DEFAULT_OG_IMAGE = "/opengraph-image";

// Posts shorter than this (and without an image) are "thin" — we keep them
// out of the index and the sitemap.
export const MIN_INDEXABLE_POST_LENGTH = 50;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Trim to `max` chars on a word boundary, collapsing whitespace. */
export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

interface PageMetadataInput {
  /** Without the brand — the root title template appends " | DoonMeet". */
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  keywords?: string[];
  /** Use for the home page where the brand is part of the title itself. */
  absoluteTitle?: boolean;
  noindex?: boolean;
}

export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  keywords,
  absoluteTitle,
  noindex,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const shareImage = image || DEFAULT_OG_IMAGE;
  const shareTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(keywords && { keywords }),
    alternates: { canonical: url },
    ...(noindex && { robots: { index: false, follow: true } }),
    openGraph: {
      title: shareTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_IN",
      type,
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [shareImage],
    },
  };
}

/** Metadata for private / utility pages that must stay out of search results. */
export function noIndexMetadata(title: string, description?: string): Metadata {
  return {
    title,
    ...(description && { description }),
    robots: { index: false, follow: true },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
