import type { Metadata } from "next";
import Link from "next/link";
import CommunityCard from "@/components/communities/CommunityCard";
import EmptyState from "@/components/shared/EmptyState";
import { getAllCommunities } from "@/lib/communities";

export const metadata: Metadata = {
  title: "Communities in Dehradun | DoonMeet",
  description:
    "Whether you're into tech, photography, food or weekend treks, there's a Dehradun community on DoonMeet for it — or start your own.",
  alternates: { canonical: "https://doonmeet.in/communities" },
};

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Tech", value: "tech" },
  { label: "Nature", value: "nature" },
  { label: "Food", value: "food" },
  { label: "Photography", value: "photography" },
  { label: "Sports", value: "sports" },
  { label: "Arts", value: "arts" },
  { label: "General", value: "general" },
];

interface CommunitiesPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function CommunitiesPage({ searchParams }: CommunitiesPageProps) {
  const { category } = await searchParams;
  const communities = await getAllCommunities(category);
  const activeCategory = category ?? "";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
        <h1 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl lg:text-2xl">Communities</h1>

        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 sm:mb-6">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.value;
            return (
              <Link
                key={cat.value}
                href={cat.value ? `/communities?category=${cat.value}` : "/communities"}
                className="btn-springy shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:text-sm"
                style={
                  isActive
                    ? { backgroundColor: "rgb(var(--primary))", color: "white" }
                    : { backgroundColor: "rgb(var(--primary) / 0.08)", color: "rgb(var(--primary))" }
                }
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        {communities.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No communities found"
            description="No communities in this category yet."
          />
        ) : (
          <div className="stagger-grid grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {communities.map((community) => (
              <CommunityCard
                key={String(community._id)}
                name={community.name as string}
                slug={community.slug as string}
                description={community.description as string}
                banner={community.banner as string | null}
                icon={community.icon as string | null}
                category={community.category as string}
                memberCount={community.memberCount as number}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}