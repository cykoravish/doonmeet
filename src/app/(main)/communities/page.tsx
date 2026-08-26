import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";
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

  const totalMembers = communities.reduce(
    (sum, c) => sum + (c.memberCount as number),
    0
  );

  return (
    <div className="min-h-screen">
      <div className="border-b py-14" style={{ backgroundColor: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
        <div className="mx-auto max-w-7xl px-6">
          <PageHeader
            eyebrow="Find your tribe"
            title="Communities in Dehradun"
            description="Tech, food, photography, trekking — pick a group that matches your vibe, or start one if it doesn't exist yet."
          />
          <div className="flex items-center gap-6">
            {[
              { value: `${communities.length}`, label: "Communities" },
              { value: totalMembers.toLocaleString(), label: "Members" },
              { value: "7", label: "Categories" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-black" style={{ color: "rgb(var(--primary))" }}>{stat.value}</p>
                <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.value;
            return (
              <Link
                key={cat.value}
                href={cat.value ? `/communities?category=${cat.value}` : "/communities"}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all"
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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