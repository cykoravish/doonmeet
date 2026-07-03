import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Calendar, Globe } from "lucide-react";
import type { Metadata } from "next";

const CATEGORY_ICONS: Record<string, string> = {
  tech: "💻",
  nature: "🌿",
  food: "🍜",
  photography: "📸",
  sports: "⚽",
  arts: "🎨",
  general: "🏙️",
};

const CATEGORY_COLORS: Record<string, string> = {
  tech: "rgb(100 120 220)",
  nature: "rgb(34 120 80)",
  food: "rgb(220 80 60)",
  photography: "rgb(160 100 200)",
  sports: "rgb(194 140 74)",
  arts: "rgb(220 120 60)",
  general: "rgb(40 160 100)",
};

// Fallback community data — replace with DB fetch when seeded
const FALLBACK_COMMUNITIES: Record<
  string,
  {
    name: string;
    slug: string;
    description: string;
    category: string;
    memberCount: number;
    createdBy: { name: string };
  }
> = {
  "doon-tech-hub": {
    name: "Doon Tech Hub",
    slug: "doon-tech-hub",
    description:
      "A thriving community for developers, designers, founders and tech enthusiasts in Dehradun. Whether you're building your first app or running a startup — you belong here. Share projects, discuss ideas, find collaborators and grow together in the Doon Valley's tech ecosystem.",
    category: "tech",
    memberCount: 245,
    createdBy: { name: "DoonMeet" },
  },
  "doon-nature-lovers": {
    name: "Doon Nature Lovers",
    slug: "doon-nature-lovers",
    description:
      "Dehradun is surrounded by breathtaking natural beauty — and this community is dedicated to exploring every bit of it. From forest trails to hidden rivers, from peaceful hilltop views to monsoon magic. Share your favourite spots, organise group walks and celebrate the Doon Valley's incredible nature.",
    category: "nature",
    memberCount: 320,
    createdBy: { name: "DoonMeet" },
  },
  "doon-foodies": {
    name: "Doon Foodies",
    slug: "doon-foodies",
    description:
      "From the best momos on Paltan Bazaar to hidden cafes on Rajpur Road — Dehradun's food scene is incredible. Join fellow food lovers to discover restaurants, share reviews, organise food walks and find the next great dish in the city.",
    category: "food",
    memberCount: 180,
    createdBy: { name: "DoonMeet" },
  },
  "doon-photographers": {
    name: "Doon Photographers",
    slug: "doon-photographers",
    description:
      "Dehradun is one of India's most photogenic cities — with stunning mountains, colonial architecture, misty forests and vibrant street life. This community is for photographers of all levels to share their work, discover new locations and organise photography walks together.",
    category: "photography",
    memberCount: 156,
    createdBy: { name: "DoonMeet" },
  },
  "doon-sports-club": {
    name: "Doon Sports Club",
    slug: "doon-sports-club",
    description:
      "Find your next sports partner in Dehradun. Whether you're into cricket, football, badminton, cycling or trekking — connect with active people, organise matches and discover the best sports facilities across the city.",
    category: "sports",
    memberCount: 210,
    createdBy: { name: "DoonMeet" },
  },
  "doon-arts-culture": {
    name: "Doon Arts & Culture",
    slug: "doon-arts-culture",
    description:
      "Celebrate Dehradun's rich artistic and cultural heritage. From traditional music and dance to contemporary art and theatre — this community brings together creative souls to collaborate, exhibit and inspire each other.",
    category: "arts",
    memberCount: 98,
    createdBy: { name: "DoonMeet" },
  },
  "doon-general": {
    name: "Doon General",
    slug: "doon-general",
    description:
      "The heart of DoonMeet — a space for everything and everyone in Dehradun. Local news, announcements, recommendations, questions and conversations. If it's about Dehradun, it belongs here.",
    category: "general",
    memberCount: 540,
    createdBy: { name: "DoonMeet" },
  },
};

async function getCommunity(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/communities/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return FALLBACK_COMMUNITIES[slug] ?? null;
    const data = await res.json();
    return data.community ?? FALLBACK_COMMUNITIES[slug] ?? null;
  } catch {
    return FALLBACK_COMMUNITIES[slug] ?? null;
  }
}

interface CommunityPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CommunityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) return { title: "Community Not Found | DoonMeet" };

  return {
    title: `${community.name} | DoonMeet Communities`,
    description: community.description?.slice(0, 155),
  };
}

// Fake upcoming events per community — replace with real API later
const COMMUNITY_EVENTS: Record<string, { title: string; date: string; location: string }[]> = {
  "doon-tech-hub": [
    { title: "React & Next.js Meetup", date: "28 Jun 2026", location: "Rajpur Road" },
    { title: "Startup Pitch Night", date: "5 Jul 2026", location: "Clock Tower Area" },
  ],
  "doon-nature-lovers": [
    { title: "Sunrise Trek — Mussoorie Road", date: "29 Jun 2026", location: "Mussoorie Road" },
    { title: "Robber's Cave Walk", date: "6 Jul 2026", location: "Robber's Cave" },
  ],
  "doon-photographers": [
    { title: "FRI Photography Walk", date: "30 Jun 2026", location: "FRI Campus" },
  ],
};

export default async function CommunityDetailPage({ params }: CommunityPageProps) {
  const { slug } = await params;
  const community = await getCommunity(slug);

  if (!community) notFound();

  const color = CATEGORY_COLORS[community.category] ?? "rgb(34 120 80)";
  const emoji = CATEGORY_ICONS[community.category] ?? "🏙️";
  const events = COMMUNITY_EVENTS[slug] ?? [];

  return (
    <div className="min-h-screen">
      {/* Hero banner */}
      <div
        className="relative overflow-hidden py-16"
        style={{
          background: `linear-gradient(135deg, ${color}20 0%, transparent 60%)`,
          borderBottom: `1px solid rgb(var(--border))`,
        }}
      >
        {/* Decorative circle */}
        <div
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-5"
          style={{ backgroundColor: color }}
        />

        <div className="relative mx-auto max-w-5xl px-6">
          {/* Back */}
          <Link
            href="/communities"
            className="mb-8 flex w-fit items-center gap-1.5 text-sm hover:underline text-muted"
          >
            <ArrowLeft size={14} />
            All Communities
          </Link>

          <div className="flex items-start gap-5">
            {/* Icon */}
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 bg-surface text-3xl shadow-md"
              style={{
                borderColor: `${color}30`,
              }}
            >
              {emoji}
            </div>

            <div className="flex-1">
              {/* Category badge */}
              <span
                className="mb-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize"
                style={{ backgroundColor: `${color}15`, color }}
              >
                {community.category}
              </span>

              <h1 className="mb-2 text-3xl font-black md:text-4xl">{community.name}</h1>
              <p
                className="max-w-xl text-sm leading-relaxed text-muted"
              >
                {community.description}
              </p>

              {/* Stats row */}
              <div className="mt-5 flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-1.5 text-sm">
                  <Users size={15} style={{ color }} />
                  <span className="font-bold">{community.memberCount.toLocaleString()}</span>
                  <span style={{ color: "rgb(var(--muted))" }}>members</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Globe size={15} style={{ color }} />
                  <span style={{ color: "rgb(var(--muted))" }}>Public community</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <span style={{ color: "rgb(var(--muted))" }}>
                    Created by <span className="font-semibold">{community.createdBy?.name}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Left — main */}
          <div className="space-y-8">
            {/* About card */}
            <div
              className="rounded-2xl border p-6"
              style={{
                borderColor: "rgb(var(--border))",
                backgroundColor: "rgb(var(--surface))",
              }}
            >
              <h2 className="mb-4 font-bold">About this community</h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgb(var(--muted))" }}>
                {community.description}
              </p>
            </div>

            {/* Coming soon — discussions */}
            <div
              className="rounded-2xl border p-6"
              style={{
                borderColor: "rgb(var(--border))",
                backgroundColor: "rgb(var(--surface))",
              }}
            >
              <h2 className="mb-1 font-bold">Discussions</h2>
              <p className="mb-6 text-xs" style={{ color: "rgb(var(--muted))" }}>
                Community discussions are coming soon. Stay tuned!
              </p>

              {/* Teaser posts */}
              <div className="space-y-3 opacity-40 pointer-events-none select-none">
                {[
                  "What's everyone working on this week?",
                  "Best spots for our next meetup in Dehradun?",
                  "Introductions — share who you are!",
                ].map((title) => (
                  <div
                    key={title}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "rgb(var(--border))" }}
                  >
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
                      Coming soon
                    </p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div
                className="mt-6 rounded-xl border-2 border-dashed p-4 text-center"
                style={{ borderColor: `${color}30` }}
              >
                <p className="text-sm font-semibold" style={{ color }}>
                  🚀 Discussions launching soon
                </p>
                <p className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
                  Join now to be notified when discussions go live
                </p>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Join CTA */}
            <div
              className="rounded-2xl p-5 text-center"
              style={{
                background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                border: `1px solid ${color}20`,
              }}
            >
              <div className="mb-3 text-3xl">{emoji}</div>
              <p className="mb-1 font-bold">Join this community</p>
              <p className="mb-4 text-xs" style={{ color: "rgb(var(--muted))" }}>
                Connect with {community.memberCount.toLocaleString()} members
              </p>
              <Link
                href="/signup"
                className="block w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: color }}
              >
                Sign up to join
              </Link>
              <Link
                href="/login"
                className="mt-2 block text-xs hover:underline"
                style={{ color: "rgb(var(--muted))" }}
              >
                Already a member? Log in
              </Link>
            </div>

            {/* Upcoming events */}
            {events.length > 0 && (
              <div
                className="rounded-2xl border p-5"
                style={{
                  borderColor: "rgb(var(--border))",
                  backgroundColor: "rgb(var(--surface))",
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold">Upcoming Events</h3>
                  <Link href="/events" className="text-xs hover:underline" style={{ color }}>
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.title}
                      className="flex items-start gap-3 rounded-xl p-3"
                      style={{ backgroundColor: "rgb(var(--background))" }}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <Calendar size={14} style={{ color }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold leading-snug">{event.title}</p>
                        <p className="mt-0.5 text-xs" style={{ color: "rgb(var(--muted))" }}>
                          {event.date} · {event.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similar communities */}
            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: "rgb(var(--border))",
                backgroundColor: "rgb(var(--surface))",
              }}
            >
              <h3 className="mb-3 font-bold">More Communities</h3>
              <div className="space-y-2">
                {Object.values(FALLBACK_COMMUNITIES)
                  .filter((c) => c.slug !== slug)
                  .slice(0, 4)
                  .map((c) => (
                    <Link
                      key={c.slug}
                      href={`/communities/${c.slug}`}
                      className="flex items-center gap-2 rounded-xl p-2 transition-colors hover:opacity-80"
                      style={{ backgroundColor: "rgb(var(--background))" }}
                    >
                      <span className="text-base">{CATEGORY_ICONS[c.category]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-semibold">{c.name}</p>
                        <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                          {c.memberCount} members
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
