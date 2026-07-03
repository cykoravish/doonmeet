import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";
import CommunityCard from "@/components/communities/CommunityCard";
import EmptyState from "@/components/shared/EmptyState";

export const metadata: Metadata = {
  title: "Communities in Dehradun | DoonMeet",
  description:
    "Join local communities in Dehradun. Connect with tech enthusiasts, photographers, foodies, trekkers and more.",
};

async function getCommunities(category?: string) {
  try {
    const params = new URLSearchParams({ limit: "20" });
    if (category) params.set("category", category);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/communities?${params.toString()}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.communities ?? [];
  } catch {
    return [];
  }
}

const FALLBACK_COMMUNITIES = [
  {
    _id: "1",
    name: "Doon Tech Hub",
    slug: "doon-tech-hub",
    description: "For developers, designers and tech enthusiasts in Dehradun.",
    banner: null,
    icon: null,
    category: "tech",
    memberCount: 245,
  },
  {
    _id: "2",
    name: "Doon Nature Lovers",
    slug: "doon-nature-lovers",
    description: "Explore forests, rivers and hills around Dehradun.",
    banner: null,
    icon: null,
    category: "nature",
    memberCount: 320,
  },
  {
    _id: "3",
    name: "Doon Foodies",
    slug: "doon-foodies",
    description: "Discover the best restaurants and street food in Dehradun.",
    banner: null,
    icon: null,
    category: "food",
    memberCount: 180,
  },
  {
    _id: "4",
    name: "Doon Photographers",
    slug: "doon-photographers",
    description: "Find photogenic spots and organise photography walks.",
    banner: null,
    icon: null,
    category: "photography",
    memberCount: 156,
  },
  {
    _id: "5",
    name: "Doon Sports Club",
    slug: "doon-sports-club",
    description: "Find players, organise matches and discover sports facilities.",
    banner: null,
    icon: null,
    category: "sports",
    memberCount: 210,
  },
  {
    _id: "6",
    name: "Doon Arts & Culture",
    slug: "doon-arts-culture",
    description: "Celebrate art, music and culture of Dehradun.",
    banner: null,
    icon: null,
    category: "arts",
    memberCount: 98,
  },
  {
    _id: "7",
    name: "Doon General",
    slug: "doon-general",
    description: "Everything and everyone in Dehradun.",
    banner: null,
    icon: null,
    category: "general",
    memberCount: 540,
  },
];

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
  const communities = await getCommunities(category);
  const displayCommunities = communities.length > 0 ? communities : FALLBACK_COMMUNITIES;
  const activeCategory = category ?? "";

  const filtered = activeCategory
    ? displayCommunities.filter((c: { category: string }) => c.category === activeCategory)
    : displayCommunities;

  return (
    <div className="min-h-screen">
      <div className="border-b py-14 bg-surface border-border">
        <div className="mx-auto max-w-7xl px-6">
          <PageHeader
            eyebrow="Find your tribe"
            title="Communities in Dehradun"
            description="Join groups built around your interests and connect with like-minded people across the Doon Valley."
          />
          <div className="flex items-center gap-6">
            {[
              { value: `${displayCommunities.length}`, label: "Communities" },
              { value: "1,500+", label: "Members" },
              { value: "7", label: "Categories" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-black text-primary">{stat.value}</p>
                <p className="text-xs text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Filter pills */}
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.value;
            return (
              <Link
                key={cat.value}
                href={cat.value ? `/communities?category=${cat.value}` : "/communities"}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary border-primary text-white"
                    : "bg-surface border-border text-muted"
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No communities found"
            description="No communities in this category yet."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(
              (community: {
                _id: string;
                name: string;
                slug: string;
                description: string;
                banner: string | null;
                icon: string | null;
                category: string;
                memberCount: number;
              }) => (
                <CommunityCard
                  key={community._id}
                  name={community.name}
                  slug={community.slug}
                  description={community.description}
                  banner={community.banner}
                  icon={community.icon}
                  category={community.category}
                  memberCount={community.memberCount}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
