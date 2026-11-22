import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { withViewerLikes } from "@/lib/postLikes";
import {
  BUSINESS_POST_WINDOW_MS,
  BUSINESS_POSTS_PER_WINDOW,
  categoryQuery,
  type PostCategory,
} from "@/lib/postCategories";

export interface PostListItem {
  _id: string;
  content: string;
  category?: PostCategory;
  sponsoredUntil?: string | null;
  image: string | null;
  /** Photo size in px — missing on posts made before sizes were stored. */
  imageWidth?: number | null;
  imageHeight?: number | null;
  commentCount: number;
  /** Missing on posts created before likes existed → 0. */
  likeCount?: number;
  /** Whether the viewer has ❤️ it (false for guests / when not computed). */
  likedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
  /** Set only when the author edited the post. */
  editedAt?: string | null;
  author: { _id: string; name: string; avatar: string | null };
}

// Shared by the /posts page (direct DB call for the first server-rendered
// page) and reused for SEO metadata / sitemap generation.
export async function getPosts(
  options: { limit?: number; author?: string; category?: PostCategory; viewerId?: string | null } = {}
): Promise<PostListItem[]> {
  await connectDB();
  const { limit = 20, author, category, viewerId } = options;

  const query: Record<string, unknown> = category ? categoryQuery(category) : {};
  if (author) query.author = author;

  const posts = await Post.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .populate("author", "name avatar")
    .select("-imagePublicId -__v")
    .lean();

  // Plain-object round-trip so this is always safe to pass to Client
  // Components, whether used directly or via a Server Component wrapper.
  return JSON.parse(JSON.stringify(await withViewerLikes(posts, viewerId)));
}

export async function getPostById(id: string, viewerId?: string | null): Promise<PostListItem | null> {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectDB();
  const post = await Post.findById(id)
    .populate("author", "name avatar")
    .select("-imagePublicId -__v")
    .lean();
  if (!post) return null;
  const [withLike] = await withViewerLikes([post], viewerId);
  // Mongoose lean() objects still contain ObjectId/Date instances (which
  // carry a toJSON but aren't "plain objects"), so they can't cross the
  // Server -> Client Component boundary as-is. Round-tripping through
  // JSON gives a fully plain, serializable object.
  return JSON.parse(JSON.stringify(withLike));
}

export async function getPostStats() {
  await connectDB();
  const [totalPosts, authors] = await Promise.all([
    Post.countDocuments(),
    Post.distinct("author"),
  ]);
  return { totalPosts, authorCount: authors.length };
}

/**
 * Free business promotion limit: a user may publish BUSINESS_POSTS_PER_WINDOW
 * "business" posts per rolling 7 days. Returns null if allowed, otherwise
 * when the next one is allowed. Pass excludePostId when editing a post.
 */
export async function checkBusinessPostLimit(
  userId: string,
  excludePostId?: string
): Promise<{ nextAllowedAt: Date } | null> {
  await connectDB();
  const since = new Date(Date.now() - BUSINESS_POST_WINDOW_MS);
  const query: Record<string, unknown> = {
    author: userId,
    category: "business",
    createdAt: { $gte: since },
  };
  if (excludePostId) query._id = { $ne: excludePostId };

  const recent = await Post.find(query)
    .sort({ createdAt: 1 })
    .limit(BUSINESS_POSTS_PER_WINDOW)
    .select("createdAt")
    .lean<{ createdAt: Date }[]>();

  if (recent.length < BUSINESS_POSTS_PER_WINDOW) return null;
  return { nextAllowedAt: new Date(new Date(recent[0].createdAt).getTime() + BUSINESS_POST_WINDOW_MS) };
}

/**
 * Currently sponsored posts for the top of the feed (optionally one category).
 * Rotates fairly when more posts are sponsored than there are slots.
 */
export async function getActiveSponsoredPosts(
  options: { category?: PostCategory; slots?: number; viewerId?: string | null } = {}
): Promise<PostListItem[]> {
  const { category, slots = 2, viewerId } = options;
  await connectDB();
  const query: Record<string, unknown> = {
    ...(category ? categoryQuery(category) : {}),
    sponsoredUntil: { $gt: new Date() },
  };
  const posts = await Post.find(query)
    .sort({ sponsoredUntil: -1 })
    .limit(12)
    .populate("author", "name avatar")
    .select("-imagePublicId -__v")
    .lean();

  // Fisher–Yates shuffle, then take the visible slots.
  for (let i = posts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [posts[i], posts[j]] = [posts[j], posts[i]];
  }
  return JSON.parse(JSON.stringify(await withViewerLikes(posts.slice(0, slots), viewerId)));
}
