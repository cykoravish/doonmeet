// ❤️ helpers: which of these posts has the viewer liked?
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { PostLike } from "@/models/PostLike";

/** Ids (as strings) of the posts in `postIds` that `userId` has liked. */
export async function getLikedPostIds(userId: string | null | undefined, postIds: string[]): Promise<Set<string>> {
  if (!userId || !mongoose.isValidObjectId(userId) || postIds.length === 0) return new Set();
  await connectDB();
  const rows = await PostLike.find({ user: userId, post: { $in: postIds } })
    .select("post")
    .lean<{ post: mongoose.Types.ObjectId }[]>();
  return new Set(rows.map((r) => String(r.post)));
}

/** Returns the posts with `likedByMe` filled in for this viewer (false for guests). */
export async function withViewerLikes<T extends { _id: unknown }>(
  posts: T[],
  userId: string | null | undefined
): Promise<(T & { likedByMe: boolean })[]> {
  const liked = await getLikedPostIds(userId, posts.map((p) => String(p._id)));
  return posts.map((p) => ({ ...p, likedByMe: liked.has(String(p._id)) }));
}
