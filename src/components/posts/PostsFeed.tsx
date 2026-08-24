"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  authorFilter?: string;
  currentUser: { _id: string; name: string; avatar: string | null } | null;
}

export default function PostsFeed({
  initialPosts,
  initialNextCursor,
  isLoggedIn,
  isGuest,
  authorFilter,
  currentUser,
}: PostsFeedProps) {
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingRef = useRef(false); // guards against duplicate fires from the observer
  const sentinelRef = useRef<HTMLDivElement>(null);

  const feedUrl = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams();
      if (authorFilter) params.set("author", authorFilter);
      if (cursor) params.set("cursor", cursor);
      const qs = params.toString();
      return `/api/posts${qs ? `?${qs}` : ""}`;
    },
    [authorFilter]
  );

  const refreshFeed = useCallback(() => {
    fetch(feedUrl())
      .then((r) => r.json())
      .then((d) => {
        setPosts(d.posts ?? []);
        setNextCursor(d.nextCursor ?? null);
      })
      .catch(() => {});
  }, [feedUrl]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);
    try {
      const res = await fetch(feedUrl(nextCursor));
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) => [...prev, ...(data.posts ?? [])]);
        setNextCursor(data.nextCursor ?? null);
      }
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [nextCursor, feedUrl]);

  // Auto-load the next page once the sentinel scrolls into view — this is
  // what gives a smooth, mobile-friendly infinite feed instead of a tap.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "600px" } // start loading well before the user hits bottom
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, loadMore]);

  const showComposer = isLoggedIn && currentUser && !isGuest && !authorFilter;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {showComposer ? (
        <CreatePostForm currentUser={currentUser!} onPosted={refreshFeed} />
      ) : (
        !authorFilter && (
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
        )
      )}

      {posts.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No posts yet"
          description={
            authorFilter
              ? "This person hasn't shared any posts yet."
              : "Be the first to share something with Dehradun!"
          }
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
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loadingMore ? (
            <Loader2 size={18} className="animate-spin" style={{ color: "rgb(var(--muted))" }} />
          ) : (
            <button
              onClick={loadMore}
              className="text-xs font-medium underline-offset-2 hover:underline"
              style={{ color: "rgb(var(--muted))" }}
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
