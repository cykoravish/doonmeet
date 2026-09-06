import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PostsFeed from "@/components/posts/PostsFeed";
import { getSessionUser } from "@/lib/getSessionUser";
import { getPublicUser } from "@/lib/getPublicUser";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";

export const metadata: Metadata = {
  title: "Posts — Community Feed | DoonMeet",
  description:
    "See what people in Dehradun are sharing right now — jobs, events, questions, and everyday moments from the Doon Valley community.",
  keywords: ["Dehradun posts", "Dehradun community feed", "Doon Valley updates", "local Dehradun news"],
  alternates: { canonical: "https://doonmeet.in/posts" },
  openGraph: {
    title: "Posts — Community Feed | DoonMeet",
    description: "See what people in Dehradun are sharing right now.",
    url: "https://doonmeet.in/posts",
  },
};

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
      <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6 sm:py-4">
        {filteredUser && (
          <div className="mb-3">
            <Link
              href="/posts"
              className="mb-1.5 flex w-fit items-center gap-1.5 text-xs font-medium"
              style={{ color: "rgb(var(--muted))" }}
            >
              <ArrowLeft size={13} /> All Posts
            </Link>
            <h1 className="text-lg font-black sm:text-xl">Posts by {filteredUser.name}</h1>
          </div>
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
