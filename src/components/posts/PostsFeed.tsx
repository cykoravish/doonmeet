"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2, Plus, X } from "lucide-react";
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
  authorFilter?: string;
  currentUser: { _id: string; name: string; avatar: string | null } | null;
}

export default function PostsFeed({
  initialPosts,
  initialNextCursor,
  isLoggedIn,
  authorFilter,
  currentUser,
}: PostsFeedProps) {
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
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

  // Close on Escape, and lock background scroll while the composer sheet is open —
  // standard modal behavior, self-contained and doesn't touch feed data logic.
  useEffect(() => {
    if (!composerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setComposerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [composerOpen]);

  const showComposer = isLoggedIn && currentUser && !authorFilter;

  return (
    <div className="mx-auto max-w-2xl">
      {!showComposer && !authorFilter && (
        <div
          className="mb-4 rounded-2xl p-3.5 text-center"
          style={{ backgroundColor: "rgb(var(--primary) / 0.05)" }}
        >
          <p className="text-sm font-medium">Log in to share a post with the community.</p>
        </div>
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
        <div className="stagger-grid sm:space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              id={post._id}
              content={post.content}
              image={post.image}
              commentCount={post.commentCount}
              createdAt={post.createdAt}
              author={post.author}
              isOwner={!!currentUser && currentUser._id === post.author._id}
              onDeleted={() => setPosts((prev) => prev.filter((p) => p._id !== post._id))}
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

      {/* Instagram-style "+" FAB — replaces the old always-visible composer so the
          whole feed area is dedicated to actual posts. Sits above the mobile bottom nav. */}
      {showComposer && (
        <button
          onClick={() => setComposerOpen(true)}
          aria-label="Create post"
          className="btn-springy fixed bottom-[calc(env(safe-area-inset-bottom)+76px)] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg md:bottom-8"
          style={{ backgroundColor: "rgb(var(--primary))" }}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {showComposer && composerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="composer-backdrop absolute inset-0 bg-black/50"
            onClick={() => setComposerOpen(false)}
          />
          <div className="composer-sheet relative w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface sm:max-w-lg sm:rounded-2xl">
            <div
              className="sticky top-0 flex items-center justify-between border-b px-4 py-3 sm:px-5"
              style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}
            >
              <h2 className="text-base font-bold">Create post</h2>
              <button
                onClick={() => setComposerOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors active:opacity-70"
                style={{ color: "rgb(var(--muted))" }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 sm:p-5">
              <CreatePostForm
                currentUser={currentUser!}
                onPosted={() => {
                  refreshFeed();
                  setComposerOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
