import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PostsFeed from "@/components/posts/PostsFeed";
import { getSessionUser } from "@/lib/getSessionUser";
import { getPublicUser } from "@/lib/getPublicUser";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Dehradun Community Feed — Posts & Local Updates",
  description:
    "See what people in Dehradun are sharing right now — questions, recommendations, events and everyday moments from the Doon Valley.",
  path: "/posts",
  keywords: ["Dehradun posts", "Dehradun community feed", "Doon Valley updates"],
});

const PAGE_SIZE = 20;

async function getInitialFeed(author?: string) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (author) query.author = author;

  const posts = await Post.find(query)
    .sort({ _id: -1 })
    .limit(PAGE_SIZE)
    .populate("author", "name avatar")
    .select("-imagePublicId -__v")
    .lean();

  const nextCursor = posts.length === PAGE_SIZE ? String(posts[posts.length - 1]._id) : null;
  return { posts: JSON.parse(JSON.stringify(posts)), nextCursor };
}

interface PostsPageProps {
  searchParams: Promise<{ author?: string }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { author } = await searchParams;
  const isValidAuthor = author && /^[a-f\d]{24}$/i.test(author);

  const [{ posts, nextCursor }, currentUser, filteredUser] = await Promise.all([
    getInitialFeed(isValidAuthor ? author : undefined),
    getSessionUser(),
    isValidAuthor ? getPublicUser(author) : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Posts", path: "/posts" }])} />
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
          <header className="mb-4">
            <h1 className="text-[28px] leading-tight font-extrabold sm:text-3xl">Doon Feed</h1>
            <p className="mt-0.5 text-[15px] text-muted">What people in Dehradun are sharing right now</p>
          </header>
        )}

        <PostsFeed
          initialPosts={posts}
          initialNextCursor={nextCursor}
          isLoggedIn={!!currentUser}
          authorFilter={isValidAuthor ? author : undefined}
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
