import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface LiveChatCardProps {
  onlineCount: number;
}

// Static ridge silhouette — one tiny inline SVG, no image request.
function Ridge() {
  return (
    <svg
      viewBox="0 0 390 80"
      className="pointer-events-none absolute right-0 bottom-0 h-16 w-[120%] max-w-none opacity-15"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 80 L60 30 L95 52 L160 6 L215 48 L250 28 L330 70 L390 40 L390 80 Z"
        className="fill-on-primary"
      />
    </svg>
  );
}

export default function LiveChatCard({ onlineCount }: LiveChatCardProps) {
  const hasPeople = onlineCount > 1;

  return (
    <Link
      href="/chat"
      className="relative block overflow-hidden rounded-[22px] bg-primary p-5 text-on-primary transition-colors hover:bg-primary/95"
    >
      <Ridge />
      <span className="relative flex items-center gap-2 text-sm font-semibold">
        <span className="h-2.5 w-2.5 rounded-full bg-on-primary ring-4 ring-on-primary/25" aria-hidden="true" />
        Live in public chat
      </span>
      <span className="relative mt-2 block max-w-[17rem] font-display text-[22px] leading-snug font-bold">
        {hasPeople
          ? `${onlineCount} people are online right now`
          : "Say hi to Dehradun — the public chat is open"}
      </span>
      <span className="relative mt-4 inline-flex h-11 items-center gap-1.5 rounded-[14px] bg-on-primary px-4 text-[15px] font-bold text-primary">
        Join chat
        <ArrowRight size={17} aria-hidden="true" />
      </span>
    </Link>
  );
}
