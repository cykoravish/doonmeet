"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import PostCard from "./PostCard";
import CreatePostForm from "./CreatePostForm";
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

interface PostsFeedProps {
  initialPosts: PostItem[];
  initialNextCursor: string | null;
  isLoggedIn: boolean;
  isGuest: boolean;
  currentUser: { _id: string; name: string; avatar: string | null } | null;
}

export default function PostsFeed({
  initialPosts,
  initialNextCursor,
  isLoggedIn,
  isGuest,
  currentUser,
}: PostsFeedProps) {
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  const refreshFeed = useCallback(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((d) => {
        setPosts(d.posts ?? []);
        setNextCursor(d.nextCursor ?? null);
      })
      .catch(() => {});
  }, []);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/posts?cursor=${nextCursor}`);
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
    <div className="mx-auto max-w-2xl space-y-4">
      {isLoggedIn && currentUser && !isGuest ? (
        <CreatePostForm currentUser={currentUser} onPosted={refreshFeed} />
      ) : (
        <div
          className="rounded-2xl p-5 text-center"
          style={{ backgroundColor: "rgb(var(--primary) / 0.05)" }}
        >
          <p className="text-sm font-medium">
            {isGuest
              ? "Sign up to share your own posts with the community."
              : "Log in to share a post with the community."}
          </p>
        </div>
      )}

      {posts.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No posts yet"
          description="Be the first to share something with Dehradun!"
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
            />
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
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
