import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Community } from "@/models/Community";
import { Event } from "@/models/Event";
import { Post } from "@/models/Post";
import { Place } from "@/models/Place";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://doonmeet.in";

  const staticRoutes = ["", "/posts", "/communities", "/events", "/places", "/chat"].map(
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

  let communityRoutes: MetadataRoute.Sitemap = [];
  let eventRoutes: MetadataRoute.Sitemap = [];
  let postRoutes: MetadataRoute.Sitemap = [];
  // Pulled live from the DB below (was a hardcoded slug list before, so new
  // places never made it into the sitemap until someone remembered to add
  // them here). Falls back to an empty list if the query fails.
  let placeRoutes: MetadataRoute.Sitemap = [];

  try {
    await connectDB();

    const places = await Place.find({}).select("slug updatedAt").lean();
    placeRoutes = places.map((p) => ({
      url: `${base}/places/${p.slug}`,
      lastModified: p.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

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

    // Cap at the most recent 1000 posts — sitemaps beyond that should be
    // split into a sitemap index, but this comfortably covers current scale.
    const posts = await Post.find({})
      .sort({ _id: -1 })
      .limit(1000)
      .select("_id updatedAt")
      .lean();
    postRoutes = posts.map((p) => ({
      url: `${base}/posts/${p._id}`,
      lastModified: p.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    }));
  } catch (err) {
    console.error("[sitemap] Failed to fetch dynamic routes:", err);
  }

  return [...staticRoutes, ...legalRoutes, ...placeRoutes, ...communityRoutes, ...eventRoutes, ...postRoutes];
}
