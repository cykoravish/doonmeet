import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Users } from "lucide-react";
import CategoryIcon from "@/components/shared/CategoryIcon";

interface CommunityCardProps {
  name: string;
  slug: string;
  description: string;
  banner: string | null;
  icon: string | null;
  category: string;
  memberCount: number;
}

// Compact row-style card: icon, name, one-line pitch, member count.
// Fits more communities on a phone screen than tall banner cards.
export default function CommunityCard({ name, slug, description, icon, category, memberCount }: CommunityCardProps) {
  return (
    <Link
      href={`/communities/${slug}`}
      className="flex h-full items-center gap-3.5 rounded-[20px] border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-primary-soft text-primary-fg">
        {icon ? (
          <Image src={icon} alt="" width={56} height={56} sizes="56px" className="h-full w-full object-cover" />
        ) : (
          <CategoryIcon category={category} size={26} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-bold text-text">{name}</h2>
        {description && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{description}</p>}
        <p className="mt-1.5 flex items-center gap-2 text-[13px]">
          <span className="flex items-center gap-1 font-semibold text-primary-fg">
            <Users size={14} aria-hidden="true" />
            {memberCount > 0
              ? `${memberCount.toLocaleString()} ${memberCount === 1 ? "member" : "members"}`
              : "Be the first to join"}
          </span>
          <span className="text-muted capitalize">· {category}</span>
        </p>
      </div>

      <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden="true" />
    </Link>
  );
}
