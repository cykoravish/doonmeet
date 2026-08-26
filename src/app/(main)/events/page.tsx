import Link from "next/link";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import EventCard from "@/components/events/EventCard";
import { getEvents, getEventStats } from "@/lib/events";

export const metadata: Metadata = {
  title: "Events in Dehradun | DoonMeet",
  description:
    "From tech meetups to nature walks, see what's happening around Dehradun this week — and RSVP in a couple of taps.",
  keywords: ["Dehradun events", "local meetups", "Doon Valley events", "things to do in Dehradun"],
  alternates: { canonical: "https://doonmeet.in/events" },
};

const TAGS = [
  { label: "All", value: "" },
  { label: "Tech", value: "tech" },
  { label: "Nature", value: "nature" },
  { label: "Food", value: "food" },
  { label: "Photography", value: "photography" },
  { label: "Sports", value: "sports" },
  { label: "Arts", value: "arts" },
];

interface EventsPageProps {
  searchParams: Promise<{ tag?: string; search?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { tag, search } = await searchParams;

  const [events, stats] = await Promise.all([getEvents({ tag, search }), getEventStats()]);
  const activeTag = tag ?? "";

  return (
    <div className="min-h-screen">
      <div
        className="border-b py-14"
        style={{ backgroundColor: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <PageHeader
            eyebrow="What's happening"
            title="Events in Dehradun"
            description="See what's happening around Dehradun this week, and RSVP in a couple of taps."
            action={
              <Link
                href="/events/create"
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "rgb(var(--primary))" }}
              >
                <Plus size={16} />
                Create Event
              </Link>
            }
          />

          <div className="flex items-center gap-6">
            {[
              { value: `${stats.totalEvents}`, label: "Upcoming events" },
              { value: `${stats.organiserCount}`, label: "Organisers" },
              { value: `${stats.totalRSVPs}`, label: "RSVPs" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-black" style={{ color: "rgb(var(--primary))" }}>
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
          {TAGS.map((t) => {
            const isActive = activeTag === t.value;
            return (
              <Link
                key={t.value}
                href={t.value ? `/events?tag=${t.value}` : "/events"}
                className="shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? "rgb(var(--primary))" : "rgb(var(--surface))",
                  borderColor: isActive ? "rgb(var(--primary))" : "rgb(var(--border))",
                  color: isActive ? "white" : "rgb(var(--muted))",
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon="🎉"
            title="No events yet"
            description="Be the first to create an event in Dehradun!"
            action={
              <Link
                href="/events/create"
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: "rgb(var(--primary))" }}
              >
                <Plus size={15} />
                Create first event
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => (
              <EventCard
                key={String(event._id)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}