interface PhotoCreditBadgeProps {
  credit: { author: string; license: string } | null | undefined;
}

// Tiny attribution overlay for photos we didn't take (Wikimedia Commons,
// CC BY / BY-SA). Plain text — cards are already links, so no nested link;
// the place page shows the full credit with links to the source and license.
export default function PhotoCreditBadge({ credit }: PhotoCreditBadgeProps) {
  if (!credit) return null;
  return (
    <span className="absolute right-1.5 bottom-1.5 max-w-[85%] truncate rounded bg-black/55 px-1.5 py-0.5 text-[10px] leading-tight text-white/90">
      Photo: {credit.author} · {credit.license}
    </span>
  );
}
