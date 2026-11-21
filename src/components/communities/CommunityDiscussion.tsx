"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageCircle, Loader2, Send, MessagesSquare } from "lucide-react";
import UserLink from "@/components/shared/UserLink";
import Avatar from "@/components/ui/Avatar";
import { buttonClasses } from "@/components/ui/Button";

interface Author {
  _id: string;
  name: string;
  avatar: string | null;
}
interface Post {
  _id: string;
  content: string;
  commentCount: number;
  createdAt: string;
  author: Author;
}
interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  author: Author;
}

interface CommunityDiscussionProps {
  slug: string;
  isMember: boolean;
  isLoggedIn: boolean;
  /** @deprecated colours now come from theme tokens. */
  color?: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const inputClass =
  "min-w-0 flex-1 rounded-[14px] border-[1.5px] border-transparent bg-surface-2 px-4 text-base text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface";

function PostComments({
  slug,
  postId,
  isMember,
  onAdded,
}: {
  slug: string;
  postId: string;
  isMember: boolean;
  onAdded: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/communities/${slug}/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, postId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/communities/${slug}/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (res.ok) {
        setText("");
        onAdded();
        load();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2.5 border-t border-border pt-3">
      {loading ? (
        <Loader2 size={18} className="animate-spin text-muted" aria-label="Loading comments" />
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted">No replies yet.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {comments.map((c) => {
            const name = c.author?.name ?? "Deleted User";
            return (
              <li key={c._id} className="flex gap-2">
                <UserLink userId={c.author?._id} className="shrink-0">
                  <Avatar name={name} src={c.author?.avatar} size={32} />
                </UserLink>
                <div className="min-w-0 flex-1 rounded-[14px] rounded-tl-[6px] bg-surface-2 px-3 py-2">
                  <p className="text-[13px]">
                    <UserLink userId={c.author?._id} className="font-bold">
                      {name}
                    </UserLink>{" "}
                    <span className="text-muted">· {timeAgo(c.createdAt)}</span>
                  </p>
                  <p className="text-[15px] wrap-anywhere whitespace-pre-line">{c.content}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isMember && (
        <form onSubmit={submit} className="flex gap-2">
          <label htmlFor={`reply-${postId}`} className="sr-only">
            Write a reply
          </label>
          <input
            id={`reply-${postId}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a reply…"
            maxLength={500}
            className={`h-11 ${inputClass}`}
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            aria-label="Send reply"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary text-on-primary disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={17} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={17} aria-hidden="true" />
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function CommunityDiscussion({ slug, isMember, isLoggedIn }: CommunityDiscussionProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = useCallback(() => {
    fetch(`/api/communities/${slug}/posts`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bumpCommentCount(postId: string) {
    setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)));
  }

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/communities/${slug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPost.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Something went wrong.");
        return;
      }
      setNewPost("");
      loadPosts();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      {isMember ? (
        <form onSubmit={submitPost} className="rounded-[20px] border border-border bg-surface p-3">
          <label htmlFor="community-post-input" className="sr-only">
            Share something with the community
          </label>
          <textarea
            id="community-post-input"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share something with the community…"
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-[14px] border-[1.5px] border-transparent bg-surface-2 px-4 py-3 text-base leading-relaxed text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface"
          />
          {error && (
            <p role="alert" className="mt-1 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={posting || !newPost.trim()}
              className={buttonClasses("primary", "md", "px-6")}
            >
              {posting ? (
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              ) : (
                <Send size={17} aria-hidden="true" />
              )}
              Post
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3 rounded-[20px] bg-primary-soft p-4">
          <p className="min-w-0 flex-1 text-[15px] text-text">
            {isLoggedIn ? "Join this community to post and reply." : "Log in and join to take part in the discussion."}
          </p>
          {!isLoggedIn && (
            <Link href="/login" className={buttonClasses("primary", "sm", "shrink-0")}>
              Log in
            </Link>
          )}
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <div className="flex flex-col gap-3" aria-label="Loading discussion">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 rounded-[20px] bg-surface-2" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center rounded-[20px] border border-dashed border-border py-10 text-center">
            <MessagesSquare size={26} className="mb-2 text-muted" aria-hidden="true" />
            <p className="font-semibold">No posts yet</p>
            <p className="mt-0.5 text-[15px] text-muted">Start the conversation — say hi to the group!</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {posts.map((post) => {
              const name = post.author?.name ?? "Deleted User";
              const isOpen = expanded.has(post._id);
              return (
                <li key={post._id} className="rounded-[20px] border border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <UserLink userId={post.author?._id} className="shrink-0">
                      <Avatar name={name} src={post.author?.avatar} size={40} />
                    </UserLink>
                    <p className="min-w-0 leading-tight">
                      <UserLink userId={post.author?._id} className="block truncate font-bold">
                        {name}
                      </UserLink>
                      <span className="text-[13px] text-muted">{timeAgo(post.createdAt)}</span>
                    </p>
                  </div>
                  <p className="mt-2.5 text-[16px] leading-relaxed wrap-anywhere whitespace-pre-line">{post.content}</p>
                  <button
                    type="button"
                    onClick={() => toggle(post._id)}
                    aria-expanded={isOpen}
                    className="mt-2 flex h-10 items-center gap-1.5 rounded-[12px] bg-surface-2 px-3 text-sm font-semibold text-text transition-colors hover:bg-border"
                  >
                    <MessageCircle size={17} aria-hidden="true" />
                    {post.commentCount > 0
                      ? `${post.commentCount} ${post.commentCount === 1 ? "reply" : "replies"}`
                      : "Reply"}
                  </button>
                  {isOpen && (
                    <PostComments
                      slug={slug}
                      postId={post._id}
                      isMember={isMember}
                      onAdded={() => bumpCommentCount(post._id)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
