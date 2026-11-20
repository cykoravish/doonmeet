import Link from "next/link";
import type { HomeCommunity } from "@/lib/home";
import CategoryIcon from "@/components/shared/CategoryIcon";
import SectionHeader from "./SectionHeader";

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
          return (
            <li key={community._id}>
              <Link
                href={`/communities/${community.slug}`}
                className="flex h-full flex-col gap-2 rounded-[20px] border border-border bg-surface p-3.5 transition-colors hover:bg-surface-2"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary-soft text-primary-fg">
                  <CategoryIcon category={community.category} size={20} />
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
