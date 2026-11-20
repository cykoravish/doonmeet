"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ImagePlus, Loader2, Newspaper, X } from "lucide-react";
import PostCard from "./PostCard";
import CreatePostForm from "./CreatePostForm";
import EmptyState from "@/components/shared/EmptyState";
import Avatar from "@/components/ui/Avatar";
import IconButton from "@/components/ui/IconButton";
import { buttonClasses } from "@/components/ui/Button";
import type { PostCategory } from "@/lib/postCategories";

interface Author {
  _id: string;
  name: string;
  avatar: string | null;
}

interface PostItem {
  _id: string;
  content: string;
  category?: PostCategory | null;
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
  /** Active category filter (/posts?category=…). */
  categoryFilter?: PostCategory;
  /** Paid posts pinned above the feed (server-picked, rotated per request). */
  sponsoredPosts?: PostItem[];
  currentUser: { _id: string; name: string; avatar: string | null } | null;
}

export default function PostsFeed({
  initialPosts,
  initialNextCursor,
  isLoggedIn,
  authorFilter,
  categoryFilter,
  sponsoredPosts = [],
  currentUser,
}: PostsFeedProps) {
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const loadingRef = useRef(false); // guards against duplicate fires from the observer
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const feedUrl = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams();
      if (authorFilter) params.set("author", authorFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (cursor) params.set("cursor", cursor);
      const qs = params.toString();
      return `/api/posts${qs ? `?${qs}` : ""}`;
    },
    [authorFilter, categoryFilter]
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

  // Auto-load the next page once the sentinel scrolls into view.
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

  // Escape closes, background scroll is locked, focus moves into the sheet.
  useEffect(() => {
    if (!composerOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setComposerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [composerOpen]);

  const showComposer = isLoggedIn && currentUser && !authorFilter;
  const sponsoredIds = new Set(sponsoredPosts.map((p) => p._id));

  // "Write a post" in the bottom-nav Create sheet links to /posts?compose=1 —
  // open the composer, then drop the param so a refresh/back doesn't reopen it.
  const searchParams = useSearchParams();
  const router = useRouter();
  const wantsCompose = searchParams.get("compose") === "1";
  useEffect(() => {
    if (!wantsCompose) return;
    if (showComposer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setComposerOpen(true);
    }
    router.replace("/posts", { scroll: false });
  }, [wantsCompose, showComposer, router]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Composer trigger — opens the create-post sheet */}
      {showComposer && (
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="mb-3 flex w-full items-center gap-3 rounded-[20px] border border-border bg-surface p-2.5 pl-3 text-left transition-colors hover:bg-surface-2"
        >
          <Avatar name={currentUser!.name} src={currentUser!.avatar} size={40} />
          <span className="min-w-0 flex-1 truncate text-base text-muted">
            Kya chal raha hai Doon mein?
          </span>
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary-soft text-primary-fg"
            aria-hidden="true"
          >
            <ImagePlus size={20} />
          </span>
        </button>
      )}

      {/* Guests: a clear, friendly way in — not just "log in to post" */}
      {!showComposer && !authorFilter && (
        <div className="mb-3 rounded-[20px] bg-primary-soft p-4">
          <p className="font-semibold text-text">Apni baat Doon tak pahunchao</p>
          <p className="mt-0.5 text-sm text-muted">
            Share a job, ask for a recommendation or post weekend plans — it&apos;s free.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/login" className={buttonClasses("outline", "md")}>
              Log in
            </Link>
            <Link href="/signup" className={buttonClasses("primary", "md")}>
              Sign up free
            </Link>
          </div>
        </div>
      )}

      {/* Sponsored posts — pinned on top, clearly labelled, not repeated below */}
      {sponsoredPosts.length > 0 && (
        <section aria-label="Sponsored posts" className="mb-3 flex flex-col gap-3">
          {sponsoredPosts.map((post) => (
            <PostCard
              key={`sponsored-${post._id}`}
              id={post._id}
              content={post.content}
              category={post.category}
              image={post.image}
              commentCount={post.commentCount}
              createdAt={post.createdAt}
              author={post.author}
              sponsored
              isOwner={!!currentUser && currentUser._id === post.author?._id}
            />
          ))}
        </section>
      )}

      {posts.length === 0 ? (
        <EmptyState
          icon={<Newspaper size={28} />}
          title="No posts yet"
          description={
            authorFilter
              ? "This person hasn't shared any posts yet."
              : "Be the first to share something with Dehradun!"
          }
          action={
            showComposer ? (
              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className={buttonClasses("primary", "md")}
              >
                Write the first post
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {posts
            .filter((post) => !sponsoredIds.has(post._id))
            .map((post) => (
              <PostCard
                key={post._id}
                id={post._id}
                content={post.content}
                category={post.category}
                image={post.image}
                commentCount={post.commentCount}
                createdAt={post.createdAt}
                author={post.author}
                isOwner={!!currentUser && currentUser._id === post.author?._id}
                onDeleted={() => setPosts((prev) => prev.filter((p) => p._id !== post._id))}
              />
            ))}
        </div>
      )}

      {nextCursor && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loadingMore ? (
            <Loader2
              size={20}
              className="animate-spin text-muted"
              aria-label="Loading more posts"
            />
          ) : (
            <button type="button" onClick={loadMore} className={buttonClasses("secondary", "sm")}>
              Load more
            </button>
          )}
        </div>
      )}

      {!nextCursor && posts.length > 0 && (
        <p className="py-8 text-center text-sm text-muted">You&apos;re all caught up</p>
      )}

      {showComposer && composerOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div
            className="composer-backdrop absolute inset-0 bg-black/50"
            onClick={() => setComposerOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-post-title"
            tabIndex={-1}
            className="composer-sheet relative max-h-[90dvh] w-full overflow-y-auto rounded-t-[28px] bg-surface outline-none sm:max-w-lg sm:rounded-[28px]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-4 pt-3 pb-2 sm:px-5">
              <h2 id="create-post-title" className="text-xl font-extrabold">
                Create post
              </h2>
              <IconButton label="Close" onClick={() => setComposerOpen(false)}>
                <X size={20} />
              </IconButton>
            </div>
            <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-5 sm:pb-5">
              <CreatePostForm
                currentUser={currentUser!}
                initialCategory={categoryFilter}
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
