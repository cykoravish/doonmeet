"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, MessageSquareOff, Loader2 } from "lucide-react";
import StarRatingInput from "./StarRatingInput";
import UserLink from "@/components/shared/UserLink";

interface Review {
  _id: string;
  rating: number;
  text: string;
  createdAt: string;
  user: { _id: string; name: string; avatar: string | null };
}

interface CurrentUser {
  _id: string;
  name: string;
  isGuest: boolean;
}

interface PlaceReviewsProps {
  slug: string;
  currentUser: CurrentUser | null;
  initialRating: number | null;
  initialReviewCount: number;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(months / 12)} yr ago`;
}

export default function PlaceReviews({
  slug,
  currentUser,
  initialRating,
  initialReviewCount,
}: PlaceReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadReviews = useCallback(() => {
    fetch(`/api/places/${slug}/reviews`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews ?? []);
        setLoading(false);
        const mine = (d.reviews ?? []).find(
          (r: Review) => r.user._id === currentUser?._id
        );
        if (mine) {
          setRating(mine.rating);
          setText(mine.text);
        }
      })
      .catch(() => setLoading(false));
  }, [slug, currentUser?._id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const myExistingReview = reviews.find((r) => r.user._id === currentUser?._id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0 || text.trim().length < 10) {
      setError("Pick a rating and write at least 10 characters.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/places/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.errors?.[0]?.message || data.message || "Something went wrong.");
        return;
      }
      loadReviews();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Aggregate summary */}
      <div className="flex items-center gap-4">
        <p className="text-4xl font-black">{initialRating ?? "—"}</p>
        <div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={16}
                fill={initialRating && initialRating >= n ? "currentColor" : "none"}
                style={{ color: "rgb(var(--accent))" }}
              />
            ))}
          </div>
          <p className="mt-0.5 text-sm" style={{ color: "rgb(var(--muted))" }}>
            {initialReviewCount === 0
              ? "No reviews yet — be the first!"
              : `Based on ${initialReviewCount} ${initialReviewCount === 1 ? "review" : "reviews"}`}
          </p>
        </div>
      </div>

      {/* Write a review — gated */}
      <div className="mt-6">
        {!currentUser ? (
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "rgb(var(--primary) / 0.05)" }}
          >
            <p className="font-semibold">Been here? Share your experience.</p>
            <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
              Log in or create a free account to leave a review.
            </p>
            <div className="mt-3 flex gap-2">
              
              <a href="/login"
                className="rounded-lg border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: "rgb(var(--border))" }}
              >
                Log in
              </a>
              
               <a href="/signup"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "rgb(var(--primary))" }}
              >
                Sign up
              </a>
            </div>
          </div>
        ) : currentUser.isGuest ? (
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "rgb(var(--primary) / 0.05)" }}
          >
            <p className="font-semibold">Guest accounts can&apos;t post reviews</p>
            <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
              Sign up for a free account to share your experience.
            </p>
            
             <a href="/signup"
              className="mt-3 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "rgb(var(--primary))" }}
            >
              Sign up
            </a>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border p-5"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            <p className="font-semibold">
              {myExistingReview ? "Update your review" : "Write a review"}
            </p>
            <div className="mt-3">
              <StarRatingInput value={rating} onChange={setRating} />
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What did you like about this place?"
              rows={3}
              maxLength={1000}
              className="mt-3 w-full rounded-xl border px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: "rgb(var(--background))",
                borderColor: "rgb(var(--border))",
                color: "rgb(var(--text))",
              }}
            />
            {error && (
              <p className="mt-2 text-xs" style={{ color: "rgb(220 38 38)" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="mt-3 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: "rgb(var(--primary))" }}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {myExistingReview ? "Update review" : "Post review"}
            </button>
          </form>
        )}
      </div>

      {/* Reviews list */}
      <div className="mt-8 space-y-4">
        {loading ? (
          <Loader2 size={20} className="animate-spin" style={{ color: "rgb(var(--muted))" }} />
        ) : reviews.length === 0 ? (
          <div
            className="flex flex-col items-center rounded-2xl border py-12 text-center"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            <MessageSquareOff size={26} style={{ color: "rgb(var(--muted))" }} />
            <p className="mt-2 text-sm" style={{ color: "rgb(var(--muted))" }}>
              No reviews yet. Yours could be the first!
            </p>
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r._id}
              className="rounded-2xl border p-5"
              style={{ borderColor: "rgb(var(--border))" }}
            >
              <div className="flex items-start gap-3">
                <UserLink userId={r.user._id} className="shrink-0">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: "rgb(var(--primary))" }}
                  >
                    {r.user.name[0]?.toUpperCase()}
                  </div>
                </UserLink>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <UserLink userId={r.user._id} className="text-sm font-semibold">
                      {r.user.name}
                    </UserLink>
                    <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                      {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  <div className="mt-0.5 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={12}
                        fill={r.rating >= n ? "currentColor" : "none"}
                        style={{ color: "rgb(var(--accent))" }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-sm" style={{ color: "rgb(var(--text))" }}>
                    {r.text}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}