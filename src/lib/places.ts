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

export async function getPlaceWithRating(slug: string): Promise<PlaceWithRating | null> {
  await connectDB();
  const place = await Place.findOne({ slug });
  if (!place) return null;
  const [withRating] = await attachRatings([place]);
  return withRating;
}