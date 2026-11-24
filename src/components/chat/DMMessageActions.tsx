"use client";

import { useEffect, useRef } from "react";
import { Copy, Reply, X } from "lucide-react";
import { DM_REACTIONS } from "@/lib/dmShared";
import type { DMMessage } from "./dmTypes";

interface DMMessageActionsProps {
  message: DMMessage;
  /** The emoji I already reacted with on this message, if any. */
  myReaction: string | null;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onCopy: () => void;
  onClose: () => void;
}

// Bottom sheet inside the chat window: quick reactions + Reply / Copy.
// CSS-only open animation (composer-sheet / composer-backdrop in globals.css).
export default function DMMessageActions({
  message,
  myReaction,
  onReact,
  onReply,
  onCopy,
  onClose,
}: DMMessageActionsProps) {
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const preview = message.type === "profile" ? message.content : message.content.replace(/\s+/g, " ");

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Message options">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="composer-backdrop absolute inset-0 bg-black/40"
      />
      <div className="composer-sheet relative w-full max-w-md rounded-t-[24px] border border-border bg-surface px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg sm:mb-4 sm:rounded-[24px]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />

        <p className="mb-3 line-clamp-2 px-1 text-sm text-muted">{preview}</p>

        <div className="flex justify-between gap-1" role="group" aria-label="React">
          {DM_REACTIONS.map((emoji, i) => {
            const selected = myReaction === emoji;
            return (
              <button
                key={emoji}
                ref={i === 0 ? firstRef : undefined}
                type="button"
                onClick={() => onReact(emoji)}
                aria-pressed={selected}
                aria-label={selected ? `Remove ${emoji} reaction` : `React with ${emoji}`}
                className={`btn-springy flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                  selected ? "bg-primary-soft ring-2 ring-primary" : "hover:bg-surface-2"
                }`}
              >
                {emoji}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-col border-t border-border pt-2">
          <button
            type="button"
            onClick={onReply}
            className="flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-left text-[15px] font-semibold text-text hover:bg-surface-2"
          >
            <Reply size={20} className="text-muted" aria-hidden="true" />
            Reply
          </button>
          {message.type !== "profile" && (
            <button
              type="button"
              onClick={onCopy}
              className="flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-left text-[15px] font-semibold text-text hover:bg-surface-2"
            >
              <Copy size={20} className="text-muted" aria-hidden="true" />
              Copy text
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-left text-[15px] font-semibold text-muted hover:bg-surface-2"
          >
            <X size={20} aria-hidden="true" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
