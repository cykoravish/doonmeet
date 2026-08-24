import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import PostsFeed from "@/components/posts/PostsFeed";
import { getSessionUser } from "@/lib/getSessionUser";
import { getPostStats } from "@/lib/posts";
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

async function getInitialFeed() {
  await connectDB();
  const posts = await Post.find({})
    .sort({ _id: -1 })
    .limit(PAGE_SIZE)
    .populate("author", "name avatar")
    .select("-imagePublicId -__v")
    .lean();

  const nextCursor = posts.length === PAGE_SIZE ? String(posts[posts.length - 1]._id) : null;
  return { posts: JSON.parse(JSON.stringify(posts)), nextCursor };
}

export default async function PostsPage() {
  const [{ posts, nextCursor }, currentUser, stats] = await Promise.all([
    getInitialFeed(),
    getSessionUser(),
    getPostStats(),
  ]);

  return (
    <div className="min-h-screen">
      <div
        className="border-b py-14"
        style={{ backgroundColor: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}
      >
        <div className="mx-auto max-w-2xl px-6">
          <PageHeader
            eyebrow="Community feed"
            title="Posts from Dehradun"
            description="Jobs, events, questions, or just something on your mind — share it with the community."
          />

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
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <PostsFeed
          initialPosts={posts}
          initialNextCursor={nextCursor}
          isLoggedIn={!!currentUser}
          isGuest={!!currentUser?.isGuest}
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
