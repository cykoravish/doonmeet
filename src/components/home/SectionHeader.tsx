import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  /** Used as the section's aria-labelledby target. */
  id: string;
  href?: string;
  linkLabel?: string;
}

export default function SectionHeader({ title, id, href, linkLabel = "See all" }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 id={id} className="text-xl font-extrabold sm:text-2xl">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="-mr-2 flex min-h-11 shrink-0 items-center gap-0.5 rounded-[12px] px-2 text-sm font-semibold text-primary-fg hover:bg-primary-soft"
        >
          {linkLabel}
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
