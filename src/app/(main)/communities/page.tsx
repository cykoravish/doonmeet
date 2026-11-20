import { Users } from "lucide-react";
import CommunityCard from "@/components/communities/CommunityCard";
import EmptyState from "@/components/shared/EmptyState";
import PageHeader from "@/components/shared/PageHeader";
import FilterChips from "@/components/shared/FilterChips";
import { getAllCommunities } from "@/lib/communities";
import { CATEGORY_FILTERS } from "@/lib/communityCategories";
import { pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Communities in Dehradun — Find Your People",
  description:
    "Into tech, photography, food or weekend treks? Join a Dehradun community that matches your interests on DoonMeet and meet people who share them.",
  path: "/communities",
  keywords: ["Dehradun communities", "Dehradun groups", "meet people in Dehradun"],
});

const CATEGORIES = [...CATEGORY_FILTERS, { label: "General", value: "general" }];

interface CommunitiesPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function CommunitiesPage({ searchParams }: CommunitiesPageProps) {
  const { category } = await searchParams;
  const communities = await getAllCommunities(category);
  const activeCategory = category ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 pb-8 sm:px-6 sm:pt-8">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Communities", path: "/communities" }])} />

      <PageHeader
        title="Communities"
        description="Find people in Dehradun who love the same things you do."
      />

      <FilterChips
        label="Filter communities by interest"
        items={CATEGORIES.map((cat) => ({
          label: cat.label,
          href: cat.value ? `/communities?category=${cat.value}` : "/communities",
          active: activeCategory === cat.value,
        }))}
      />

      {communities.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No communities here yet"
          description="Try another interest — or check back soon."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <li key={String(community._id)}>
              <CommunityCard
                name={community.name as string}
                slug={community.slug as string}
                description={community.description as string}
                banner={community.banner as string | null}
                icon={community.icon as string | null}
                category={community.category as string}
                memberCount={community.memberCount as number}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
