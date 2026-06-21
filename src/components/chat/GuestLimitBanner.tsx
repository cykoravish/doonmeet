import Link from "next/link";

interface GuestLimitBannerProps {
  remaining: number;
  reached: boolean;
}

export default function GuestLimitBanner({ remaining, reached }: GuestLimitBannerProps) {
  if (reached) {
    return (
      <div
        className="flex items-center justify-between rounded-xl border px-4 py-3"
        style={{
          backgroundColor: "rgb(220 38 38 / 0.06)",
          borderColor: "rgb(220 38 38 / 0.2)",
        }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "rgb(220 38 38)" }}>
            You&apos;ve reached the guest message limit
          </p>
          <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            Sign up free to keep chatting without limits
          </p>
        </div>
        <Link
          href="/signup"
          className="shrink-0 rounded-xl px-4 py-2 text-xs font-semibold text-white"
          style={{ backgroundColor: "rgb(var(--primary))" }}
        >
          Sign up free
        </Link>
      </div>
    );
  }

  if (remaining <= 5) {
    return (
      <div
        className="rounded-xl border px-4 py-2.5"
        style={{
          backgroundColor: "rgb(var(--accent) / 0.08)",
          borderColor: "rgb(var(--accent) / 0.2)",
        }}
      >
        <p className="text-xs" style={{ color: "rgb(var(--accent))" }}>
          ⚠️ {remaining} messages left as guest.{" "}
          <Link href="/signup" className="font-semibold underline">
            Sign up free
          </Link>{" "}
          for unlimited chat.
        </p>
      </div>
    );
  }

  return null;
}