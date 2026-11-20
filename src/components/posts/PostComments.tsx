"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Send } from "lucide-react";
import UserLink from "@/components/shared/UserLink";
import Avatar from "@/components/ui/Avatar";
import { buttonClasses } from "@/components/ui/Button";
import { timeAgo } from "./PostCard";

interface Author {
  _id: string;
  name: string;
  avatar: string | null;
}

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  author: Author;
}

interface PostCommentsProps {
  postId: string;
  initialCommentCount: number;
  isLoggedIn: boolean;
}

export default function PostComments({ postId, initialCommentCount, isLoggedIn }: PostCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState(initialCommentCount);

  const load = useCallback(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((d) => {
        setComments(d.comments ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Something went wrong.");
        return;
      }
      setText("");
      setCount((c) => c + 1);
      load();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="post-comments-title" className="mt-6">
      <h2 id="post-comments-title" className="mb-3 text-lg font-extrabold">
        {count} {count === 1 ? "comment" : "comments"}
      </h2>

      {isLoggedIn ? (
        <form onSubmit={submit} className="mb-4 flex gap-2">
          <label htmlFor="post-comment-input" className="sr-only">
            Write a comment
          </label>
          <input
            id="post-comment-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            maxLength={500}
            className="h-12 min-w-0 flex-1 rounded-[14px] border-[1.5px] border-transparent bg-surface-2 px-4 text-base text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            aria-label="Send comment"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-primary text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={18} aria-hidden="true" />
            )}
          </button>
        </form>
      ) : (
        <div className="mb-4 flex items-center gap-3 rounded-[18px] bg-primary-soft p-3.5">
          <p className="min-w-0 flex-1 text-[15px] text-text">Log in to join the conversation.</p>
          <Link href="/login" className={buttonClasses("primary", "sm", "shrink-0")}>
            Log in
          </Link>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        // Static skeleton — no shimmer animation
        <div className="flex flex-col gap-3" aria-label="Loading comments">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-2.5">
              <div className="h-9 w-9 shrink-0 rounded-full bg-surface-2" />
              <div className="h-16 flex-1 rounded-[16px] bg-surface-2" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <MessageCircle size={24} className="mb-2 text-muted" aria-hidden="true" />
          <p className="text-[15px] text-muted">No comments yet. Be the first to reply!</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => {
            const name = c.author?.name ?? "Deleted User";
            return (
              <li key={c._id} className="flex gap-2.5">
                <UserLink userId={c.author?._id}>
                  <Avatar name={name} src={c.author?.avatar} size={36} />
                </UserLink>
                <div className="min-w-0 flex-1 rounded-[16px] rounded-tl-[6px] bg-surface-2 px-3.5 py-2.5">
                  <p className="text-sm">
                    <span className="font-bold">
                      <UserLink userId={c.author?._id}>{name}</UserLink>
                    </span>{" "}
                    <span className="text-muted">
                      · <time dateTime={c.createdAt}>{timeAgo(c.createdAt)}</time>
                    </span>
                  </p>
                  <p className="mt-0.5 text-[15px] leading-relaxed break-words whitespace-pre-line">
                    {c.content}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
