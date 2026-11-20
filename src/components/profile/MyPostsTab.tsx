"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Newspaper } from "lucide-react";
import PostCard from "@/components/posts/PostCard";
import EmptyState from "@/components/shared/EmptyState";
import { buttonClasses } from "@/components/ui/Button";

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
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">My posts</h2>
          <p className="mt-0.5 text-sm text-muted">Everything you&apos;ve shared with Dehradun.</p>
        </div>
        <Link href="/posts?compose=1" className={buttonClasses("primary", "sm", "shrink-0")}>
          <Newspaper size={17} aria-hidden="true" /> New post
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3" aria-label="Loading posts">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 rounded-[20px] bg-surface-2" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<Newspaper size={28} />}
          title="No posts yet"
          description="Share a job, an event, or anything on your mind."
        />
      ) : (
        <div className="flex flex-col gap-3">
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
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className={buttonClasses("secondary", "md")}
          >
            {loadingMore && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
