import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import PostsFeed from "@/components/posts/PostsFeed";
import FilterChips from "@/components/shared/FilterChips";
import { getSessionUser } from "@/lib/getSessionUser";
import { getPublicUser } from "@/lib/getPublicUser";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { pageMetadata } from "@/lib/seo";
import { getActiveSponsoredPosts, type PostListItem } from "@/lib/posts";
import { withViewerLikes } from "@/lib/postLikes";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import {
  POST_CATEGORIES,
  categoryQuery,
  getPostCategory,
  isPostCategory,
  type PostCategory,
} from "@/lib/postCategories";

const PAGE_SIZE = 20;

interface PostsPageProps {
  searchParams: Promise<{ author?: string; category?: string }>;
}

// Each category is its own landing page for search ("PG in Dehradun",
// "jobs in Dehradun") — real, server-rendered posts with a matching title.
export async function generateMetadata({ searchParams }: PostsPageProps): Promise<Metadata> {
  const { category } = await searchParams;
  if (isPostCategory(category)) {
    const info = getPostCategory(category);
    return pageMetadata({
      title: info.seoTitle,
      description: info.seoDescription,
      path: `/posts?category=${category}`,
      keywords: info.keywords,
    });
  }
  return pageMetadata({
    title: "Dehradun Community Feed — Posts & Local Updates",
    description:
      "See what people in Dehradun are sharing right now — questions, recommendations, jobs, rentals and everyday moments from the Doon Valley.",
    path: "/posts",
    keywords: ["Dehradun posts", "Dehradun community feed", "Doon Valley updates"],
  });
}

async function getInitialFeed(author?: string, category?: PostCategory) {
  await connectDB();
  const query: Record<string, unknown> = category ? categoryQuery(category) : {};
  if (author) query.author = author;

  const posts = await Post.find(query)
    .sort({ _id: -1 })
    .limit(PAGE_SIZE)
    .populate("author", "name avatar")
    .select("-imagePublicId -__v")
    .lean();

  const nextCursor = posts.length === PAGE_SIZE ? String(posts[posts.length - 1]._id) : null;
  return { posts: JSON.parse(JSON.stringify(posts)) as PostListItem[], nextCursor };
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { author, category: rawCategory } = await searchParams;
  const isValidAuthor = author && /^[a-f\d]{24}$/i.test(author);
  const category = isPostCategory(rawCategory) ? rawCategory : undefined;
  const categoryInfo = category ? getPostCategory(category) : null;

  const [{ posts: feedPosts, nextCursor }, currentUser, filteredUser, sponsoredRaw] = await Promise.all([
    getInitialFeed(isValidAuthor ? author : undefined, category),
    getSessionUser(),
    isValidAuthor ? getPublicUser(author) : Promise.resolve(null),
    // Paid placements: on the main feed and on the post's own category feed.
    isValidAuthor ? Promise.resolve([]) : getActiveSponsoredPosts({ category }).catch(() => []),
  ]);

  // Fill in "did I ❤️ this?" for the viewer (one query for both lists).
  const viewerId = currentUser?._id ? String(currentUser._id) : null;
  const [posts, sponsoredPosts] = await Promise.all([
    withViewerLikes(feedPosts, viewerId),
    withViewerLikes(sponsoredRaw, viewerId),
  ]);

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Posts", path: "/posts" },
    ...(categoryInfo ? [{ name: categoryInfo.label, path: `/posts?category=${categoryInfo.value}` }] : []),
  ];

  return (
    <div className="min-h-screen">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-6 sm:px-6 sm:pt-6">
        {filteredUser ? (
          <header className="mb-3">
            <Link
              href="/posts"
              className="-ml-2 flex min-h-11 w-fit items-center gap-1.5 rounded-[12px] px-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-text"
            >
              <ArrowLeft size={17} aria-hidden="true" /> All posts
            </Link>
            <h1 className="text-2xl font-extrabold">Posts by {filteredUser.name}</h1>
          </header>
        ) : (
          <>
            <header className="mb-3">
              <h1 className="text-[28px] leading-tight font-extrabold sm:text-3xl">
                {categoryInfo ? categoryInfo.label : "Doon Feed"}
              </h1>
              <p className="mt-0.5 text-[15px] text-muted">
                {categoryInfo ? categoryInfo.seoDescription : "What people in Dehradun are sharing right now"}
              </p>
            </header>

            <FilterChips
              label="Filter posts by category"
              items={[
                { label: "All", href: "/posts", active: !category },
                ...POST_CATEGORIES.map((c) => ({
                  label: c.label,
                  href: `/posts?category=${c.value}`,
                  active: category === c.value,
                })),
              ]}
            />
          </>
        )}

        {/* key: switching category remounts the feed so its state starts
            from the new server-rendered page instead of the old list. */}
        <PostsFeed
          key={category ?? "all"}
          initialPosts={posts}
          initialNextCursor={nextCursor}
          isLoggedIn={!!currentUser}
          authorFilter={isValidAuthor ? author : undefined}
          categoryFilter={category}
          sponsoredPosts={sponsoredPosts}
          currentUser={
            currentUser
              ? { _id: String(currentUser._id), name: currentUser.name, avatar: currentUser.avatar }
              : null
          }
        />
      </div>
    </div>
  );
}
