"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Loader2, MessageCircle } from "lucide-react";
import UserLink from "@/components/shared/UserLink";
import Avatar from "@/components/ui/Avatar";
import { buttonClasses } from "@/components/ui/Button";

interface Comment {
  _id: string;
  content: string;
  author: { _id: string; name: string; avatar: string | null };
  createdAt: string;
}

interface EventCommentsProps {
  eventId: string;
  commentCount: number;
  isLoggedIn?: boolean;
}

export default function EventComments({ eventId, commentCount, isLoggedIn = true }: EventCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState(commentCount);

  useEffect(() => {
    fetch(`/api/events/${eventId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Failed to post comment.");
        return;
      }

      setComments((prev) => [...prev, data.comment]);
      setCount((c) => c + 1);
      setContent("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="event-comments-title">
      <h2 id="event-comments-title" className="mb-3 text-xl font-extrabold">
        Questions & comments <span className="text-muted">({count})</span>
      </h2>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
          <label htmlFor="event-comment-input" className="sr-only">
            Ask a question or leave a comment
          </label>
          <input
            id="event-comment-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ask the host something…"
            maxLength={500}
            className="h-12 min-w-0 flex-1 rounded-[14px] border-[1.5px] border-transparent bg-surface-2 px-4 text-base text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface"
          />
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            aria-label="Post comment"
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
          <p className="min-w-0 flex-1 text-[15px]">Log in to ask the host a question.</p>
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
          <p className="text-[15px] text-muted">No comments yet. Got a question? Ask away!</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => {
            const name = comment.author?.name ?? "Deleted User";
            return (
              <li key={comment._id} className="flex gap-2.5">
                <UserLink userId={comment.author?._id} className="shrink-0">
                  <Avatar name={name} src={comment.author?.avatar} size={36} />
                </UserLink>
                <div className="min-w-0 flex-1 rounded-[16px] rounded-tl-[6px] bg-surface-2 px-3.5 py-2.5">
                  <p className="text-sm">
                    <UserLink userId={comment.author?._id} className="font-bold">
                      {name}
                    </UserLink>{" "}
                    <span className="text-muted">
                      ·{" "}
                      {new Date(comment.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[15px] leading-relaxed wrap-anywhere whitespace-pre-line">
                    {comment.content}
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
