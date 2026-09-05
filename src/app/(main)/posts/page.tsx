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
      {/* Compact everywhere — mobile keeps it to one tight row so real posts are
          visible almost immediately; desktop gets a properly sized (not oversized)
          header instead of a tall banner with dead space. */}
      <div
        className="border-b py-3 sm:py-7"
        style={{ backgroundColor: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}
      >
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {filteredUser ? (
            <div>
              <Link
                href="/posts"
                className="mb-1.5 flex w-fit items-center gap-1.5 text-xs font-medium sm:mb-2"
                style={{ color: "rgb(var(--muted))" }}
              >
                <ArrowLeft size={13} /> All Posts
              </Link>
              <h1 className="text-lg font-black sm:text-2xl lg:text-3xl">Posts by {filteredUser.name}</h1>
            </div>
          ) : (
            <>
              {/* Mobile: one tight row, title only — no stat pill, no dead space. */}
              <h1 className="text-lg font-black sm:hidden">
                Posts from <span style={{ color: "rgb(var(--primary))" }}>Dehradun</span>
              </h1>

              {/* Desktop/tablet: small eyebrow + title + one-line description, tightly spaced. */}
              <div className="hidden sm:block">
                <p
                  className="mb-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "rgb(var(--primary))" }}
                >
                  Community feed
                </p>
                <h1 className="text-2xl font-black lg:text-3xl">
                  Posts from <span style={{ color: "rgb(var(--primary))" }}>Dehradun</span>
                </h1>
                <p className="mt-1.5 max-w-lg text-sm leading-relaxed" style={{ color: "rgb(var(--muted))" }}>
                  Jobs, events, questions, or just something on your mind — share it with the community.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6 sm:py-8">
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
