import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/profile", "/notifications"],
    },
    sitemap: "https://doonmeet.in/sitemap.xml",
  };
}