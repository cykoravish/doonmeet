import { connectDB } from "@/lib/db";
import { Place } from "@/models/Place";
import { PlaceReview } from "@/models/PlaceReview";
import mongoose from "mongoose";

type LeanPlace = Record<string, unknown> & { _id: mongoose.Types.ObjectId };

async function attachRatings(places: LeanPlace[]) {
  if (places.length === 0) return [];

  const ratings = await PlaceReview.aggregate([
    { $match: { place: { $in: places.map((p) => p._id) } } },
    { $group: { _id: "$place", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const ratingMap = new Map(
    ratings.map((r) => [String(r._id), { avgRating: r.avgRating, count: r.count }])
  );

  return places.map((p) => {
    const stats = ratingMap.get(String(p._id));
    return {
      ...p,
      _id: String(p._id),
      rating: stats ? Number(stats.avgRating.toFixed(1)) : null,
      reviewCount: stats?.count ?? 0,
    };
  });
}

export async function getAllPlacesWithRatings() {
  await connectDB();
  const places = await Place.find().sort({ createdAt: 1 }).lean<LeanPlace[]>();
  return attachRatings(places);
}

export async function getPlaceWithRating(slug: string) {
  await connectDB();
  const place = await Place.findOne({ slug }).lean<LeanPlace | null>();
  if (!place) return null;
  const [withRating] = await attachRatings([place]);
  return withRating;
}