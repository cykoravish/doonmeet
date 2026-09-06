import Link from "next/link";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import EmptyState from "@/components/shared/EmptyState";
import EventCard from "@/components/events/EventCard";
import { getEvents } from "@/lib/events";

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

  const events = await getEvents({ tag, search });
  const activeTag = tag ?? "";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
          <h1 className="text-lg font-black sm:text-xl lg:text-2xl">Events</h1>
          <Link
            href="/events/create"
            className="btn-springy flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white sm:px-5 sm:py-2.5 sm:text-sm"
            style={{ backgroundColor: "rgb(var(--primary))" }}
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Create Event</span>
            <span className="sm:hidden">Create</span>
          </Link>
        </div>

        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 sm:mb-6">
          {TAGS.map((t) => {
            const isActive = activeTag === t.value;
            return (
              <Link
                key={t.value}
                href={t.value ? `/events?tag=${t.value}` : "/events"}
                className="btn-springy shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors sm:text-sm"
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
          <div className="stagger-grid grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
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