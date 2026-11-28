"use client";

import { ChevronDown } from "lucide-react";

// Small pieces shared by the public chat and DM message lists.

/**
 * A day's date pill. Rendered as the first child of that day's block with
 * `position: sticky`, so it stays at the top while you scroll through the
 * day and the next day's pill pushes it away. Never blocks taps.
 */
export function DayDivider({ label }: { label: string }) {
  return (
    <div className="pointer-events-none sticky top-1 z-5 flex justify-center py-2">
      <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-muted shadow-sm">
        {label}
      </span>
    </div>
  );
}

/**
 * Round "jump to the latest message" button, bottom-right of the message
 * list. Shows when you've scrolled up, with a badge counting messages that
 * arrived meanwhile. Place it inside a `relative` box around the list so it
 * always sits just above the composer, however tall that gets.
 */
export function JumpToLatestButton({ count, onClick }: { count: number; onClick: () => void }) {
  const label =
    count > 0
      ? `${count} new ${count === 1 ? "message" : "messages"} — jump to latest`
      : "Jump to latest messages";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="fab-in absolute right-3 bottom-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text shadow-md transition-colors hover:bg-surface-2"
    >
      <ChevronDown size={22} aria-hidden="true" />
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] leading-none font-bold text-on-primary"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

/**
 * "typing…" bubble at the end of a DM (dots animate; still dots with reduced
 * motion). Visual only — the chat header already announces "typing…" to
 * screen readers.
 */
export function TypingBubble() {
  return (
    <div className="mb-2.5 flex justify-start" aria-hidden="true">
      <div className="flex h-10 items-center gap-1 rounded-[18px] rounded-bl-md border border-border bg-surface px-3.5">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}
