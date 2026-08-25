"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareButton({
  title,
  url,
  label = "Share Event",
}: {
  title: string;
  url: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-opacity hover:opacity-80"
      style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--text))" }}
    >
      {copied ? <Check size={15} /> : <Share2 size={15} />}
      {copied ? "Link copied!" : label}
    </button>
  );
}