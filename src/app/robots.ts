import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Login/signup/reset/verify pages are intentionally NOT blocked here:
      // they carry a `noindex` tag, and crawlers can only see that tag if
      // they're allowed to fetch the page. Blocking would leave bare URLs in
      // the index instead of removing them.
      disallow: [
        "/api/",
        "/profile",
        "/notifications",
        "/events/create",
        "/users/", // member profiles are personal — keep them out of crawls
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
