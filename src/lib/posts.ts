import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";

export interface PostListItem {
  _id: string;
  content: string;
  image: string | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  author: { _id: string; name: string; avatar: string | null };
}

// Shared by the /posts page (direct DB call for the first server-rendered
// page) and reused for SEO metadata / sitemap generation.
export async function getPosts(
  options: { limit?: number; author?: string } = {}
): Promise<PostListItem[]> {
  await connectDB();
  const { limit = 20, author } = options;

  const query: Record<string, unknown> = {};
  if (author) query.author = author;

  const posts = await Post.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .populate("author", "name avatar")
    .select("-imagePublicId -__v")
    .lean();

  // Plain-object round-trip so this is always safe to pass to Client
  // Components, whether used directly or via a Server Component wrapper.
  return JSON.parse(JSON.stringify(posts));
}

export async function getPostById(id: string): Promise<PostListItem | null> {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectDB();
  const post = await Post.findById(id)
    .populate("author", "name avatar")
    .select("-imagePublicId -__v")
    .lean();
  if (!post) return null;
  // Mongoose lean() objects still contain ObjectId/Date instances (which
  // carry a toJSON but aren't "plain objects"), so they can't cross the
  // Server -> Client Component boundary as-is. Round-tripping through
  // JSON gives a fully plain, serializable object.
  return JSON.parse(JSON.stringify(post));
}

export async function getPostStats() {
  await connectDB();
  const [totalPosts, authors] = await Promise.all([
    Post.countDocuments(),
    Post.distinct("author"),
  ]);
  return { totalPosts, authorCount: authors.length };
}
