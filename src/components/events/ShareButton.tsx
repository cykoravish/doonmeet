"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  title: string;
  url: string;
  label?: string;
  /** "block" = full-width button (event/post pages), "compact" = small pill (cards). */
  variant?: "block" | "compact";
}

export default function ShareButton({
  title,
  url,
  label = "Share Event",
  variant = "block",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    // Native share sheet on phones (WhatsApp etc.), clipboard fallback elsewhere.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — nothing useful to do
    }
  }

  const className =
    variant === "compact"
      ? "flex h-10 items-center gap-1.5 rounded-[12px] bg-surface-2 px-3 text-sm font-semibold text-text transition-colors hover:bg-border"
      : "flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-surface-2 text-[15px] font-semibold text-text transition-colors hover:bg-border";

  return (
    <button type="button" onClick={handleShare} className={className}>
      {copied ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
      <span aria-live="polite">{copied ? "Link copied!" : label}</span>
    </button>
  );
}
