"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export default function DeletePostButton({ postId }: { postId: string }) {
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
        router.push("/posts");
        router.refresh();
      } else {
        setDeleting(false);
        setConfirming(false);
      }
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
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
