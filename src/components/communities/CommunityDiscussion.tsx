"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { MessageCircle, Loader2, Send } from "lucide-react";

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
  color: string;
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

function Avatar({ name, avatar, size = 32 }: { name: string; avatar: string | null; size?: number }) {
  if (avatar) {
    return (
      <Image
        src={avatar}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: "rgb(var(--primary))",
        fontSize: size * 0.4,
      }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

function PostComments({
  slug,
  postId,
  color,
  isMember,
}: {
  slug: string;
  postId: string;
  color: string;
  isMember: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/communities/${slug}/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((d) => {
        setComments(d.comments ?? []);
        setLoading(false);
      });
  }, [slug, postId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/communities/${slug}/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim() }),
    });
    if (res.ok) {
      setText("");
      load();
    }
    setSubmitting(false);
  }

  return (
    <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: "rgb(var(--border))" }}>
      {loading ? (
        <Loader2 size={16} className="animate-spin" style={{ color: "rgb(var(--muted))" }} />
      ) : (
        comments.map((c) => (
          <div key={c._id} className="flex gap-2">
            <Avatar name={c.author.name} avatar={c.author.avatar} size={24} />
            <div
              className="flex-1 rounded-xl px-3 py-2 text-sm"
              style={{ backgroundColor: "rgb(var(--background))" }}
            >
              <p className="text-xs font-semibold">
                {c.author.name}{" "}
                <span className="font-normal" style={{ color: "rgb(var(--muted))" }}>
                  · {timeAgo(c.createdAt)}
                </span>
              </p>
              <p>{c.content}</p>
            </div>
          </div>
        ))
      )}

      {isMember && (
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none"
            style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--background))" }}
          />
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center rounded-lg px-3 text-white disabled:opacity-60"
            style={{ backgroundColor: color }}
          >
            <Send size={14} />
          </button>
        </form>
      )}
    </div>
  );
}

export default function CommunityDiscussion({
  slug,
  isMember,
  isLoggedIn,
  color,
}: CommunityDiscussionProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = useCallback(() => {
    fetch(`/api/communities/${slug}/posts`)
      .then((r) => r.json())
      .then((d) => {
        setPosts(d.posts ?? []);
        setLoading(false);
      });
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

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    setError("");
    const res = await fetch(`/api/communities/${slug}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newPost.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? "Something went wrong.");
      setPosting(false);
      return;
    }
    setNewPost("");
    loadPosts();
    setPosting(false);
  }

  return (
    <div>
      {isMember ? (
        <form
          onSubmit={submitPost}
          className="rounded-2xl border p-4"
          style={{ borderColor: "rgb(var(--border))" }}
        >
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share something with the community..."
            rows={2}
            maxLength={1000}
            className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none"
            style={{ backgroundColor: "rgb(var(--background))", borderColor: "rgb(var(--border))" }}
          />
          {error && (
            <p className="mt-1 text-xs" style={{ color: "rgb(220 38 38)" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={posting}
            className="mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: color }}
          >
            Post
          </button>
        </form>
      ) : (
        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "rgb(var(--primary) / 0.05)" }}>
          <p className="text-sm font-medium">
            {isLoggedIn
              ? "Join this community to post in the discussion."
              : "Log in and join to participate in the discussion."}
          </p>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {loading ? (
          <Loader2 size={20} className="animate-spin" style={{ color: "rgb(var(--muted))" }} />
        ) : posts.length === 0 ? (
          <p className="py-8 text-center text-sm" style={{ color: "rgb(var(--muted))" }}>
            No posts yet. Be the first to say something!
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post._id}
              className="rounded-2xl border p-4"
              style={{ borderColor: "rgb(var(--border))" }}
            >
              <div className="flex gap-3">
                <Avatar name={post.author.name} avatar={post.author.avatar} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {post.author.name}{" "}
                    <span className="text-xs font-normal" style={{ color: "rgb(var(--muted))" }}>
                      · {timeAgo(post.createdAt)}
                    </span>
                  </p>
                  <p className="mt-1 text-sm">{post.content}</p>
                  <button
                    onClick={() => toggle(post._id)}
                    className="mt-2 flex items-center gap-1 text-xs font-medium"
                    style={{ color }}
                  >
                    <MessageCircle size={13} /> {post.commentCount}{" "}
                    {post.commentCount === 1 ? "comment" : "comments"}
                  </button>
                </div>
              </div>
              {expanded.has(post._id) && (
                <PostComments slug={slug} postId={post._id} color={color} isMember={isMember} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}