import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import EventCard from "@/components/events/EventCard";

export const metadata: Metadata = {
  title: "Events in Dehradun | DoonMeet",
  description:
    "Discover local meetups, tech events, nature walks and community gatherings happening across Dehradun.",
  keywords: ["Dehradun events", "local meetups", "Doon Valley events", "things to do in Dehradun"],
};

async function getEvents(tag?: string, search?: string) {
  try {
    const params = new URLSearchParams({ status: "published", limit: "20" });
    if (tag) params.set("tag", tag);
    if (search) params.set("search", search);

    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events?${params.toString()}`, {
      next: { revalidate: 60 }, // revalidate every 60 seconds
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

const TAGS = [
  { label: "All", value: "" },
  { label: "Tech", value: "tech" },
  { label: "Nature", value: "nature" },
  { label: "Food", value: "food" },
  { label: "Photography", value: "photography" },
  { label: "Sports", value: "sports" },
  { label: "Arts", value: "arts" },
];

// Fallback static events for when DB is empty (good for MVP launch)
const FALLBACK_EVENTS = [
  {
    _id: "1",
    slug: "doon-tech-meetup",
    title: "Doon Tech Meetup",
    description:
      "A casual meetup for developers, designers and tech enthusiasts in Dehradun. Share what you're building and connect with the local tech community.",
    banner: null,
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: { name: "Rajpur Road", address: "Rajpur Road, Dehradun" },
    creator: { name: "DoonMeet", avatar: null },
    commentCount: 4,
    tags: ["tech"],
  },
  {
    _id: "2",
    slug: "photography-walk-fri",
    title: "Photography Walk — FRI",
    description:
      "Join fellow photographers for a morning walk through the stunning Forest Research Institute campus. All skill levels welcome.",
    banner: null,
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    location: { name: "FRI Campus", address: "New Forest, Dehradun" },
    creator: { name: "DoonMeet", avatar: null },
    commentCount: 7,
    tags: ["photography", "nature"],
  },
  {
    _id: "3",
    slug: "coffee-networking",
    title: "Coffee & Networking",
    description:
      "Meet interesting people over coffee. A relaxed networking event for entrepreneurs, freelancers and professionals in Dehradun.",
    banner: null,
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: { name: "Clock Tower Area", address: "Paltan Bazaar, Dehradun" },
    creator: { name: "DoonMeet", avatar: null },
    commentCount: 12,
    tags: ["food"],
  },
  {
    _id: "4",
    slug: "weekend-trek-mussoorie-road",
    title: "Weekend Trek — Mussoorie Road",
    description:
      "A beginner-friendly trek along the scenic Mussoorie road. Enjoy the hills, fresh air and great company.",
    banner: null,
    date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    location: { name: "Mussoorie Road", address: "Dehradun-Mussoorie Road" },
    creator: { name: "DoonMeet", avatar: null },
    commentCount: 9,
    tags: ["nature", "sports"],
  },
];

interface EventsPageProps {
  searchParams: Promise<{ tag?: string; search?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { tag, search } = await searchParams;

  const events = await getEvents(tag, search);
  const displayEvents = events.length > 0 ? events : FALLBACK_EVENTS;
  const activeTag = tag ?? "";

  return (
    <div className="min-h-screen">
      {/* Page hero banner */}
      <div
        className="border-b py-14"
        style={{
          backgroundColor: "rgb(var(--surface))",
          borderColor: "rgb(var(--border))",
        }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <PageHeader
            eyebrow="What's happening"
            title="Events in Dehradun"
            description="Discover local meetups, nature walks, tech events and community gatherings across the Doon Valley."
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

          {/* Stats row */}
          <div className="flex items-center gap-6">
            {[
              { value: `${displayEvents.length}+`, label: "Upcoming events" },
              { value: "50+", label: "Organisers" },
              { value: "500+", label: "Attendees" },
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
        {/* Filter pills */}
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

        {/* Events grid */}
        {displayEvents.length === 0 ? (
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
            {displayEvents.map(
              (event: {
                _id: string;
                slug: string;
                title: string;
                description: string;
                banner: string | null;
                date: string;
                location: { name: string; address: string };
                creator: { name: string; avatar: string | null };
                commentCount: number;
                tags: string[];
              }) => (
                <EventCard
                  key={event._id}
                  slug={event.slug}
                  title={event.title}
                  description={event.description}
                  banner={event.banner}
                  date={event.date}
                  location={event.location}
                  creator={event.creator}
                  commentCount={event.commentCount}
                  tags={event.tags}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
