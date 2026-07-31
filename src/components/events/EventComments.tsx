"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Send, Loader2 } from "lucide-react";
import UserLink from "@/components/shared/UserLink";

interface Comment {
  _id: string;
  content: string;
  author: { _id: string; name: string; avatar: string | null };
  createdAt: string;
}

interface EventCommentsProps {
  eventId: string;
  commentCount: number;
}

export default function EventComments({ eventId, commentCount }: EventCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/events/${eventId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
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
      setContent("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="mb-5 text-xl font-bold">
        Comments{" "}
        <span style={{ color: "rgb(var(--muted))" }}>({commentCount})</span>
      </h2>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div
          className="flex gap-3 rounded-2xl border p-3"
          style={{
            borderColor: "rgb(var(--border))",
            backgroundColor: "rgb(var(--surface))",
          }}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts about this event..."
            rows={2}
            maxLength={500}
            className="flex-1 resize-none bg-transparent text-sm outline-none"
            style={{ color: "rgb(var(--text))" }}
          />
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="self-end flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "rgb(var(--primary))" }}
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin text-white" />
            ) : (
              <Send size={14} className="text-white" />
            )}
          </button>
        </div>
        {error && (
          <p className="mt-1.5 text-xs" style={{ color: "rgb(220 38 38)" }}>
            {error}
          </p>
        )}
      </form>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin" style={{ color: "rgb(var(--muted))" }} />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: "rgb(var(--muted))" }}>
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-3">
              <UserLink userId={comment.author._id} className="shrink-0">
                {comment.author.avatar ? (
                  <Image
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: "rgb(var(--primary))" }}
                  >
                    {comment.author.name[0]}
                  </div>
                )}
              </UserLink>
              <div
                className="flex-1 rounded-2xl rounded-tl-none px-4 py-3"
                style={{ backgroundColor: "rgb(var(--surface))" }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <UserLink userId={comment.author._id} className="text-xs font-semibold">
                    {comment.author.name}
                  </UserLink>
                  <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                    {new Date(comment.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}