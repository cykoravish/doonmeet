"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, MessageSquareOff, Loader2 } from "lucide-react";
import StarRatingInput from "./StarRatingInput";
import UserLink from "@/components/shared/UserLink";
import Avatar from "@/components/ui/Avatar";
import { buttonClasses } from "@/components/ui/Button";

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

function Stars({ value, size }: { value: number; size: number }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={`text-accent ${value >= n ? "fill-accent" : ""}`} aria-hidden="true" />
      ))}
    </span>
  );
}

export default function PlaceReviews({ slug, currentUser, initialRating, initialReviewCount }: PlaceReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const loadReviews = useCallback(() => {
    fetch(`/api/places/${slug}/reviews`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews ?? []);
        const mine = (d.reviews ?? []).find((r: Review) => r.user?._id === currentUser?._id);
        if (mine) {
          setRating(mine.rating);
          setText(mine.text);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, currentUser?._id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const myExistingReview = reviews.find((r) => r.user?._id === currentUser?._id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0 || text.trim().length < 10) {
      setError("Pick a rating and write at least 10 characters.");
      return;
    }
    setError("");
    setSaved(false);
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
      setSaved(true);
      loadReviews();
      // Re-render the server parts so the page's average rating updates too.
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Aggregate summary */}
      <div className="flex items-center gap-4 rounded-[20px] bg-surface-2 p-4">
        <p className="font-display text-4xl font-extrabold">{initialRating ?? "—"}</p>
        <div>
          <Stars value={initialRating ?? 0} size={18} />
          <p className="mt-0.5 text-sm text-muted">
            {initialReviewCount === 0
              ? "No reviews yet — be the first!"
              : `Based on ${initialReviewCount} ${initialReviewCount === 1 ? "review" : "reviews"}`}
          </p>
        </div>
      </div>

      {/* Write a review — gated */}
      {!currentUser ? (
        <div className="rounded-[20px] bg-primary-soft p-4">
          <p className="font-semibold">Been here? Share your experience.</p>
          <p className="mt-0.5 text-[15px] text-muted">Log in or create a free account to leave a review.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
            <Link href="/login" className={buttonClasses("outline", "md")}>
              Log in
            </Link>
            <Link href="/signup" className={buttonClasses("primary", "md")}>
              Sign up
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-[20px] border border-border bg-surface p-4">
          <p className="font-bold">{myExistingReview ? "Update your review" : "Write a review"}</p>
          <div className="mt-2">
            <StarRatingInput value={rating} onChange={setRating} />
          </div>
          <label htmlFor="place-review-text" className="sr-only">
            Your review
          </label>
          <textarea
            id="place-review-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What did you like? Any tips for others?"
            rows={4}
            maxLength={1000}
            className="mt-2 w-full resize-none rounded-[14px] border-[1.5px] border-transparent bg-surface-2 px-4 py-3 text-base leading-relaxed text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface"
          />
          {error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
          {saved && !error && (
            <p role="status" className="mt-2 text-sm font-semibold text-primary-fg">
              Thanks! Your review is saved.
            </p>
          )}
          <button type="submit" disabled={submitting} className={buttonClasses("primary", "md", "mt-3 w-full sm:w-auto")}>
            {submitting && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
            {myExistingReview ? "Update review" : "Post review"}
          </button>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex flex-col gap-3" aria-label="Loading reviews">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 rounded-[20px] bg-surface-2" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center rounded-[20px] border border-dashed border-border py-10 text-center">
          <MessageSquareOff size={26} className="text-muted" aria-hidden="true" />
          <p className="mt-2 text-[15px] text-muted">No reviews yet. Yours could be the first!</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r) => {
            const name = r.user?.name ?? "Deleted User";
            return (
              <li key={r._id} className="rounded-[20px] border border-border bg-surface p-4">
                <div className="flex items-start gap-3">
                  <UserLink userId={r.user?._id} className="shrink-0">
                    <Avatar name={name} src={r.user?.avatar} size={40} />
                  </UserLink>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <UserLink userId={r.user?._id} className="truncate font-bold">
                        {name}
                      </UserLink>
                      <p className="shrink-0 text-[13px] text-muted">{timeAgo(r.createdAt)}</p>
                    </div>
                    <div className="mt-0.5">
                      <Stars value={r.rating} size={14} />
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed break-words whitespace-pre-line text-text">
                      {r.text}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
