import { connectDB } from "@/lib/db";
import { Place, IPlace } from "@/models/Place";
import { PlaceReview } from "@/models/PlaceReview";

export interface PlaceWithRating {
  _id: string;
  title: string;
  slug: string;
  image: string;
  category: string;
  shortDescription: string;
  about: string;
  highlights: string[];
  bestTimeToVisit: string;
  howToReach: string;
  imageCredit: { author: string; license: string; licenseUrl: string | null; sourceUrl: string } | null;
  rating: number | null;
  reviewCount: number;
}

async function attachRatings(placeDocs: IPlace[]): Promise<PlaceWithRating[]> {
  if (placeDocs.length === 0) return [];

  const ids = placeDocs.map((p) => p._id);

  const ratings = await PlaceReview.aggregate([
    { $match: { place: { $in: ids } } },
    { $group: { _id: "$place", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const ratingMap = new Map(
    ratings.map((r) => [
      String(r._id),
      { avgRating: r.avgRating as number, count: r.count as number },
    ])
  );

  return placeDocs.map((p) => {
    const stats = ratingMap.get(String(p._id));
    return {
      _id: String(p._id),
      title: p.title,
      slug: p.slug,
      image: p.image,
      category: p.category,
      shortDescription: p.shortDescription,
      about: p.about,
      highlights: p.highlights,
      bestTimeToVisit: p.bestTimeToVisit,
      howToReach: p.howToReach,
      imageCredit: p.imageCredit
        ? {
            author: p.imageCredit.author,
            license: p.imageCredit.license,
            licenseUrl: p.imageCredit.licenseUrl ?? null,
            sourceUrl: p.imageCredit.sourceUrl,
          }
        : null,
      rating: stats ? Number(stats.avgRating.toFixed(1)) : null,
      reviewCount: stats?.count ?? 0,
    };
  });
}

export async function getAllPlacesWithRatings(): Promise<PlaceWithRating[]> {
  await connectDB();
  const places = await Place.find().sort({ createdAt: 1 });
  return attachRatings(places);
}

export interface PlaceSummary {
  _id: string;
  title: string;
  slug: string;
  image: string;
  shortDescription: string;
}

/** Places in any of these categories (e.g. "Food & Cafes") — for "related places" links. */
export async function getPlacesByCategories(categories: string[], limit = 4): Promise<PlaceSummary[]> {
  if (categories.length === 0) return [];
  await connectDB();
  const places = await Place.find({ category: { $in: categories } })
    .sort({ createdAt: 1 })
    .limit(limit)
    .select("title slug image shortDescription")
    .lean<{ _id: unknown; title: string; slug: string; image: string; shortDescription: string }[]>();
  return places.map((p) => ({
    _id: String(p._id),
    title: p.title,
    slug: p.slug,
    image: p.image,
    shortDescription: p.shortDescription,
  }));
}

export async function getPlaceWithRating(slug: string): Promise<PlaceWithRating | null> {
  await connectDB();
  const place = await Place.findOne({ slug });
  if (!place) return null;
  const [withRating] = await attachRatings([place]);
  return withRating;
}