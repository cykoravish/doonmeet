"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useToast } from "@/providers/toast-provider";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  /** Logged-in + verified viewer. Guests are sent to log in. */
  canLike: boolean;
  /** "lg" for the post page's action row. */
  size?: "md" | "lg";
}

// ❤️ toggle. Updates instantly; the server call follows. Quick double taps
// are fine: only the LAST wanted state is sent once the previous request
// finishes, and a failure rolls back to what the server last confirmed.
export default function LikeButton({ postId, initialLiked, initialCount, canLike, size = "md" }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(Math.max(0, initialCount));
  const [popKey, setPopKey] = useState(0);
  const confirmed = useRef({ liked: initialLiked, count: Math.max(0, initialCount) });
  const wanted = useRef(initialLiked);
  const busy = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  async function sync() {
    if (busy.current) return;
    busy.current = true;
    try {
      while (wanted.current !== confirmed.current.liked) {
        const want = wanted.current;
        const res = await fetch(`/api/posts/${postId}/like`, { method: want ? "POST" : "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Couldn't update your like.");
        confirmed.current = { liked: !!data.liked, count: Math.max(0, Number(data.likeCount) || 0) };
      }
      setLiked(confirmed.current.liked);
      setCount(confirmed.current.count);
    } catch (err) {
      wanted.current = confirmed.current.liked;
      setLiked(confirmed.current.liked);
      setCount(confirmed.current.count);
      showToast(err instanceof Error ? err.message : "Couldn't update your like.", "error");
    } finally {
      busy.current = false;
    }
  }

  function toggle() {
    if (!canLike) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || "/posts")}`);
      return;
    }
    const next = !liked;
    wanted.current = next;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    if (next) setPopKey((k) => k + 1);
    sync();
  }

  const big = size === "lg";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? `Unlike post (${count} likes)` : `Like post (${count} likes)`}
      className={`flex shrink-0 items-center gap-1.5 rounded-[12px] font-semibold transition-colors ${
        big ? "h-12 px-4 text-[15px]" : "h-10 px-3 text-sm"
      } ${liked ? "bg-danger/10 text-danger" : "bg-surface-2 text-text hover:bg-border"}`}
    >
      <Heart
        key={popKey}
        size={big ? 20 : 18}
        aria-hidden="true"
        className={liked ? `fill-current ${popKey ? "like-pop" : ""}` : ""}
      />
      {count > 0 ? count : big ? "Like" : null}
    </button>
  );
}
