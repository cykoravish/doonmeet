import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";

// Shared by the /posts page (direct DB call for the first server-rendered
// page) and reused for SEO metadata / sitemap generation.
export async function getPosts(options: { limit?: number; author?: string } = {}) {
  await connectDB();
  const { limit = 20, author } = options;

  const query: Record<string, unknown> = {};
  if (author) query.author = author;

  return Post.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .populate("author", "name avatar")
    .select("-imagePublicId -__v")
    .lean();
}

export async function getPostById(id: string) {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectDB();
  return Post.findById(id)
    .populate("author", "name avatar")
    .select("-imagePublicId -__v")
    .lean();
}

export async function getPostStats() {
  await connectDB();
  const [totalPosts, authors] = await Promise.all([
    Post.countDocuments(),
    Post.distinct("author"),
  ]);
  return { totalPosts, authorCount: authors.length };
}
