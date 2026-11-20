import Link from "next/link";
import { CalendarPlus, Plus } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import PageHeader from "@/components/shared/PageHeader";
import FilterChips from "@/components/shared/FilterChips";
import EventCard from "@/components/events/EventCard";
import { buttonClasses } from "@/components/ui/Button";
import { getEvents } from "@/lib/events";
import { CATEGORY_FILTERS } from "@/lib/communityCategories";
import { pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Events in Dehradun — Meetups & Things to Do",
  description:
    "Tech meetups, nature walks, food trails, photo walks — see what's happening around Dehradun and RSVP in a couple of taps.",
  path: "/events",
  keywords: ["Dehradun events", "local meetups", "Doon Valley events", "things to do in Dehradun"],
});

interface EventsPageProps {
  searchParams: Promise<{ tag?: string; search?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { tag, search } = await searchParams;

  const events = await getEvents({ tag, search });
  const activeTag = tag ?? "";
  const activeLabel = CATEGORY_FILTERS.find((t) => t.value === activeTag)?.label;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 pb-8 sm:px-6 sm:pt-8">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Events", path: "/events" }])} />

      <PageHeader
        title="Events in Dehradun"
        description="Treks, meetups, workshops — RSVP in a couple of taps."
        action={
          <Link href="/events/create" className={buttonClasses("primary", "sm")}>
            <Plus size={18} aria-hidden="true" />
            Host
          </Link>
        }
      />

      <FilterChips
        label="Filter events by interest"
        items={CATEGORY_FILTERS.map((t) => ({
          label: t.label,
          href: t.value ? `/events?tag=${t.value}` : "/events",
          active: activeTag === t.value,
        }))}
      />

      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarPlus size={28} />}
          title={activeTag ? `No ${activeLabel?.toLowerCase()} events yet` : "No events yet"}
          description="Host the first one — a trek, a chai meetup, a workshop. Doon will show up."
          action={
            <Link href="/events/create" className={buttonClasses("primary", "md")}>
              <Plus size={18} aria-hidden="true" />
              Host an event
            </Link>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {events.map((event) => (
            <li key={String(event._id)}>
              <EventCard
                slug={event.slug as string}
                title={event.title as string}
                description={event.description as string}
                banner={event.banner as string | null}
                date={event.date as unknown as string}
                location={event.location as { name: string; address: string }}
                creator={event.creator as { name: string; avatar: string | null }}
                commentCount={event.commentCount as number}
                tags={event.tags as string[]}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
