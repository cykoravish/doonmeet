import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Community } from "@/models/Community";
import { Event } from "@/models/Event";

const PLACE_SLUGS = ["clock-tower", "rajpur-road", "fri", "robbers-cave"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://doonmeet.in";

  const staticRoutes = ["", "/locations", "/communities", "/events", "/places", "/chat"].map(
    (route) => ({
      url: `${base}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: route === "" ? 1 : 0.7,
    })
  );

  const legalRoutes = ["/privacy", "/terms", "/refund-policy"].map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  const placeRoutes = PLACE_SLUGS.map((slug) => ({
    url: `${base}/places/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  let communityRoutes: MetadataRoute.Sitemap = [];
  let eventRoutes: MetadataRoute.Sitemap = [];

  try {
    await connectDB();

    const communities = await Community.find({ isActive: true }).select("slug updatedAt").lean();
    communityRoutes = communities.map((c) => ({
      url: `${base}/communities/${c.slug}`,
      lastModified: c.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const events = await Event.find({ slug: { $exists: true, $ne: null } })
      .select("slug updatedAt")
      .lean();
    eventRoutes = events.map((e) => ({
      url: `${base}/events/${e.slug}`,
      lastModified: e.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
    console.log("even ", eventRoutes);
    console.log(" comm: ", communityRoutes);
  } catch (err) {
    console.error("[sitemap] Failed to fetch dynamic routes:", err);
  }

  return [...staticRoutes, ...legalRoutes, ...placeRoutes, ...communityRoutes, ...eventRoutes];
}
