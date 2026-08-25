"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface DeletePostButtonProps {
  postId: string;
  /** Post detail page: navigate away since the post no longer exists there. */
  redirectTo?: string;
  /** Feed/profile lists: remove the card locally instead of navigating. */
  onDeleted?: () => void;
  /** Compact icon-only variant for use inside a PostCard footer. */
  compact?: boolean;
}

export default function DeletePostButton({
  postId,
  redirectTo,
  onDeleted,
  compact = false,
}: DeletePostButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        if (onDeleted) {
          onDeleted();
        } else if (redirectTo) {
          router.push(redirectTo);
          router.refresh();
        } else {
          router.refresh();
        }
      } else {
        setDeleting(false);
        setConfirming(false);
      }
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleDelete}
        onBlur={() => setConfirming(false)}
        disabled={deleting}
        aria-label={confirming ? "Confirm delete post" : "Delete post"}
        title={confirming ? "Confirm delete?" : "Delete post"}
        className="flex min-h-[36px] min-w-[36px] items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold transition-colors active:opacity-70"
        style={{
          color: confirming ? "rgb(220 38 38)" : "rgb(var(--muted))",
          backgroundColor: confirming ? "rgb(220 38 38 / 0.1)" : "transparent",
        }}
      >
        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        {confirming && <span>Confirm?</span>}
      </button>
    );
  }

  return (
    <button
      onClick={handleDelete}
      onBlur={() => setConfirming(false)}
      disabled={deleting}
      className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60"
      style={{
        borderColor: confirming ? "rgb(220 38 38)" : "rgb(var(--border))",
        color: confirming ? "rgb(220 38 38)" : "rgb(var(--muted))",
      }}
    >
      {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      {confirming ? "Confirm delete?" : "Delete post"}
    </button>
  );
}
