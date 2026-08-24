"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Send } from "lucide-react";
import UserLink from "@/components/shared/UserLink";
import { Avatar, timeAgo } from "./PostCard";

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
    <div className="mt-8">
      <h2 className="mb-4 text-sm font-bold">
        {count} {count === 1 ? "comment" : "comments"}
      </h2>

      {isLoggedIn ? (
        <form onSubmit={submit} className="mb-5 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            maxLength={500}
            className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
            style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--background))" }}
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="flex items-center justify-center rounded-xl px-4 text-white disabled:opacity-60"
            style={{ backgroundColor: "rgb(var(--primary))" }}
          >
            <Send size={15} />
          </button>
        </form>
      ) : (
        <p className="mb-5 text-sm" style={{ color: "rgb(var(--muted))" }}>
          Log in to join the conversation.
        </p>
      )}

      {error && (
        <p className="mb-3 text-xs" style={{ color: "rgb(220 38 38)" }}>
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={18} className="animate-spin" style={{ color: "rgb(var(--muted))" }} />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-sm" style={{ color: "rgb(var(--muted))" }}>
          No comments yet. Be the first to reply!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c._id} className="flex gap-2.5">
              <UserLink userId={c.author._id}>
                <Avatar name={c.author.name} avatar={c.author.avatar} size={30} />
              </UserLink>
              <div
                className="flex-1 rounded-xl px-3.5 py-2.5 text-sm"
                style={{ backgroundColor: "rgb(var(--background))" }}
              >
                <p className="text-xs font-semibold">
                  <UserLink userId={c.author._id}>{c.author.name}</UserLink>{" "}
                  <span className="font-normal" style={{ color: "rgb(var(--muted))" }}>
                    · {timeAgo(c.createdAt)}
                  </span>
                </p>
                <p className="mt-0.5 whitespace-pre-line break-words">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
