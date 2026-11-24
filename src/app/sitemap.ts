import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Community } from "@/models/Community";
import { Event } from "@/models/Event";
import { Post } from "@/models/Post";
import { Place } from "@/models/Place";
import { MIN_INDEXABLE_POST_LENGTH, SITE_URL } from "@/lib/seo";
import { POST_CATEGORIES } from "@/lib/postCategories";
import { isPaymentsConfigured } from "@/lib/razorpay";
import { isSupportEnabled } from "@/lib/support";
import { getCommunityGuide } from "@/data/communityGuides";
import { isEventOver } from "@/lib/events";

// Without this the sitemap is generated once at build time and never again,
// so new events/places/posts would not show up until the next deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;

  const staticRoutes = ["", "/posts", "/communities", "/events", "/places", "/chat", "/explore", ...(isPaymentsConfigured() ? ["/promote"] : []), ...(isSupportEnabled() ? ["/support"] : [])].map(
    (route) => ({
      url: `${base}${route}`,
      changeFrequency: "daily" as const,
      priority: route === "" ? 1 : 0.7,
    })
  );

  // Category feeds double as landing pages ("PG in Dehradun", "jobs in Dehradun").
  const postCategoryRoutes = POST_CATEGORIES.filter((c) => c.value !== "other").map((c) => ({
    url: `${base}/posts?category=${c.value}`,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const legalRoutes = ["/privacy", "/terms", "/refund-policy", "/grievance"].map((route) => ({
    url: `${base}${route}`,
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
    communityRoutes = communities.map((c) => {
      // A community's local guide lives in code, not in its DB document, so
      // its date has to count too — otherwise Google never hears the page changed.
      const guide = getCommunityGuide(c.slug);
      const guideDate = guide ? new Date(`${guide.updatedAt}T00:00:00+05:30`) : null;
      const dbDate = c.updatedAt ? new Date(c.updatedAt) : null;
      const lastModified =
        guideDate && dbDate ? (guideDate > dbDate ? guideDate : dbDate) : guideDate ?? dbDate ?? new Date();
      return {
        url: `${base}/communities/${c.slug}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      };
    });

    // Only published events that haven't ended. Cancelled/draft ones 404 on
    // the site, and ended ones are going stale (they're noindexed a month
    // later), so listing them would just waste Google's crawl. The date
    // filter is a cheap pre-filter; isEventOver() makes the exact call.
    const events = await Event.find({
      slug: { $exists: true, $ne: null },
      status: "published",
      $or: [{ date: { $gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } }, { endsAt: { $gte: new Date() } }],
    })
      .select("slug updatedAt date endsAt")
      .lean();
    eventRoutes = events.filter((e) => !isEventOver(e.date, e.endsAt)).map((e) => ({
      url: `${base}/events/${e.slug}`,
      lastModified: e.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    // Cap at the most recent 1000 posts — sitemaps beyond that should be
    // split into a sitemap index, but this comfortably covers current scale.
    // Thin posts (very short, no image) are noindex'd on the page itself, so
    // they don't belong in the sitemap either.
    const posts = await Post.find({
      $or: [
        { image: { $nin: [null, ""] } },
        { $expr: { $gte: [{ $strLenCP: "$content" }, MIN_INDEXABLE_POST_LENGTH] } },
      ],
    })
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

  return [...staticRoutes, ...postCategoryRoutes, ...legalRoutes, ...placeRoutes, ...communityRoutes, ...eventRoutes, ...postRoutes];
}
