import Link from "next/link";

interface GuestLimitBannerProps {
  remaining: number;
  total: number;
  reached: boolean;
}

// Guest message-limit indicator, shown above the composer in the public
// chat. Redesigned around a small total (5) — a plain "remaining count"
// banner used to only appear once ≤5 were left, which meant it would now
// show from the very first message. Instead this shows a compact,
// always-present dot tracker that escalates in color as messages run out,
// so a guest sees the limit coming rather than hitting it as a surprise.
export default function GuestLimitBanner({ remaining, total, reached }: GuestLimitBannerProps) {
  if (reached) {
    return (
      <div
        className="flex flex-col gap-2.5 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        style={{
          backgroundColor: "rgb(220 38 38 / 0.06)",
          borderColor: "rgb(220 38 38 / 0.2)",
        }}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: "rgb(220 38 38)" }}>
            You&apos;ve used all {total} guest messages
          </p>
          <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            Sign up free to keep chatting without limits
          </p>
        </div>
        <Link
          href="/signup"
          className="flex shrink-0 items-center justify-center rounded-xl px-4 py-2.5 text-center text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "rgb(var(--primary))" }}
        >
          Sign up free
        </Link>
      </div>
    );
  }

  // Urgent styling kicks in for the last 2 messages — early enough to
  // register before the input disables itself, not so early that most of
  // the (already short) guest session feels alarming.
  const urgent = remaining <= 2;
  const usedCount = Math.max(total - remaining, 0);
  const tone = urgent ? "rgb(220 38 38)" : "rgb(var(--accent))";
  const toneSoft = urgent ? "rgb(220 38 38 / 0.35)" : "rgb(var(--accent) / 0.3)";

  return (
    <div
      className="flex items-center justify-between gap-2.5 rounded-xl border px-3 py-2"
      style={{
        backgroundColor: urgent ? "rgb(220 38 38 / 0.06)" : "rgb(var(--accent) / 0.08)",
        borderColor: urgent ? "rgb(220 38 38 / 0.2)" : "rgb(var(--accent) / 0.2)",
      }}
    >
      <div className="flex min-w-0 items-center gap-2">
        {/* Dot tracker — filled dot per message already used. Cheap CSS-only
            indicator, no animation, scales fine down to a 360px viewport. */}
        <div className="flex shrink-0 items-center gap-1" aria-hidden="true">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: i < usedCount ? toneSoft : tone }}
            />
          ))}
        </div>
        <p className="truncate text-xs font-medium" style={{ color: tone }}>
          {remaining} guest {remaining === 1 ? "message" : "messages"} left
        </p>
      </div>
      <Link
        href="/signup"
        className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold underline underline-offset-2 transition-opacity hover:opacity-80"
        style={{ color: tone }}
      >
        Sign up
      </Link>
    </div>
  );
}
