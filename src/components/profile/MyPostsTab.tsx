"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Newspaper } from "lucide-react";
import PostCard from "@/components/posts/PostCard";
import EmptyState from "@/components/shared/EmptyState";

interface Author {
  _id: string;
  name: string;
  avatar: string | null;
}

interface PostItem {
  _id: string;
  content: string;
  image: string | null;
  commentCount: number;
  createdAt: string;
  author: Author;
}

export default function MyPostsTab({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/posts?author=${userId}`)
      .then((r) => r.json())
      .then((d) => {
        setPosts(d.posts ?? []);
        setNextCursor(d.nextCursor ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/posts?author=${userId}&cursor=${nextCursor}`);
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) => [...prev, ...(data.posts ?? [])]);
        setNextCursor(data.nextCursor ?? null);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold">My Posts</h2>
          <p className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
            Everything you&apos;ve shared with the community.
          </p>
        </div>
        <Link
          href="/posts"
          className="flex min-h-[40px] w-fit shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold active:opacity-70"
          style={{ backgroundColor: "rgb(var(--primary) / 0.1)", color: "rgb(var(--primary))" }}
        >
          <Newspaper size={13} /> New post
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={20} className="animate-spin" style={{ color: "rgb(var(--muted))" }} />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No posts yet"
          description="Share a job, an event, or anything on your mind."
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              id={post._id}
              content={post.content}
              image={post.image}
              commentCount={post.commentCount}
              createdAt={post.createdAt}
              author={post.author}
              isOwner
              onDeleted={() => setPosts((prev) => prev.filter((p) => p._id !== post._id))}
            />
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="flex justify-center pt-5">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            {loadingMore && <Loader2 size={14} className="animate-spin" />}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
