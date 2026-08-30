import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import PostsFeed from "@/components/posts/PostsFeed";
import { getSessionUser } from "@/lib/getSessionUser";
import { getPostStats } from "@/lib/posts";
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

  const [{ posts, nextCursor }, currentUser, stats, filteredUser] = await Promise.all([
    getInitialFeed(isValidAuthor ? author : undefined),
    getSessionUser(),
    getPostStats(),
    isValidAuthor ? getPublicUser(author) : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen">
      <div
        className="border-b py-10 sm:py-14"
        style={{ backgroundColor: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}
      >
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {filteredUser ? (
            <div className="mb-4">
              <Link
                href="/posts"
                className="mb-3 flex w-fit items-center gap-1.5 text-xs font-medium"
                style={{ color: "rgb(var(--muted))" }}
              >
                <ArrowLeft size={13} /> All Posts
              </Link>
              <h1 className="text-2xl font-black sm:text-3xl">Posts by {filteredUser.name}</h1>
            </div>
          ) : (
            <PageHeader
              eyebrow="Community feed"
              title="Posts from Dehradun"
              description="Jobs, events, questions, or just something on your mind — share it with the community."
            />
          )}

          {!filteredUser && (
            <div className="flex items-center gap-6">
              {[
                { value: `${stats.totalPosts}`, label: "Posts" },
                { value: `${stats.authorCount}`, label: "People sharing" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl font-black" style={{ color: "rgb(var(--primary))" }}>
                    {stat.value}
                  </p>
                  <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
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
