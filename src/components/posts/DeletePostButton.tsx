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

// Two-tap delete: first tap arms it ("Confirm?"), second tap deletes.
// Blurring away disarms it, so a stray tap can never delete a post.
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

  const icon = deleting ? (
    <Loader2 size={17} className="animate-spin" aria-hidden="true" />
  ) : (
    <Trash2 size={17} aria-hidden="true" />
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleDelete}
        onBlur={() => setConfirming(false)}
        disabled={deleting}
        aria-label={confirming ? "Tap again to delete post" : "Delete post"}
        title={confirming ? "Tap again to delete" : "Delete post"}
        className={`flex h-10 min-w-10 items-center justify-center gap-1 rounded-[12px] px-2.5 text-sm font-semibold transition-colors ${
          confirming ? "bg-danger/10 text-danger" : "text-muted hover:bg-surface-2 hover:text-text"
        }`}
      >
        {icon}
        {confirming && <span>Delete?</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      onBlur={() => setConfirming(false)}
      disabled={deleting}
      className={`flex h-12 items-center justify-center gap-2 rounded-[14px] px-4 text-[15px] font-semibold transition-colors disabled:opacity-60 ${
        confirming ? "bg-danger text-white" : "bg-danger/10 text-danger hover:bg-danger/15"
      }`}
    >
      {icon}
      {confirming ? "Tap again to delete" : "Delete"}
    </button>
  );
}
