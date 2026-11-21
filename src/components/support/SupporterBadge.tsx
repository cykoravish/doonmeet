import { Coffee } from "lucide-react";

/** Small "☕ Supporter" pill for people who supported DoonMeet. */
export default function SupporterBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Supports DoonMeet"
      className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2.5 align-middle text-[13px] font-semibold text-accent-fg ${className}`}
    >
      <Coffee size={14} aria-hidden="true" />
      Supporter
    </span>
  );
}
