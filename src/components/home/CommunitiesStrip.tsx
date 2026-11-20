import Link from "next/link";
import {
  Camera,
  Cpu,
  Palette,
  Trees,
  Trophy,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { HomeCommunity } from "@/lib/home";
import SectionHeader from "./SectionHeader";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  tech: Cpu,
  nature: Trees,
  food: UtensilsCrossed,
  photography: Camera,
  sports: Trophy,
  arts: Palette,
};

interface CommunitiesStripProps {
  communities: HomeCommunity[];
}

export default function CommunitiesStrip({ communities }: CommunitiesStripProps) {
  if (communities.length === 0) return null;

  return (
    <section aria-labelledby="home-communities">
      <SectionHeader id="home-communities" title="Find your people" href="/communities" />

      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {communities.map((community) => {
          const Icon = CATEGORY_ICONS[community.category] ?? Users;
          return (
            <li key={community._id}>
              <Link
                href={`/communities/${community.slug}`}
                className="flex h-full flex-col gap-2 rounded-[20px] border border-border bg-surface p-3.5 transition-colors hover:bg-surface-2"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary-soft text-primary-fg">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="line-clamp-2 text-[15px] leading-snug font-semibold text-text">
                  {community.name}
                </span>
                <span className="mt-auto text-[13px] text-muted">
                  {community.memberCount > 0
                    ? `${community.memberCount} ${community.memberCount === 1 ? "member" : "members"}`
                    : "Be the first to join"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
