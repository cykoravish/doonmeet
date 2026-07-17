import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, CalendarDays, Clock, ArrowLeft, Users } from "lucide-react";
import type { Metadata } from "next";
import EventComments from "@/components/events/EventComments";

async function getEvent(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.event ?? null;
  } catch {
    return null;
  }
}

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event Not Found | DoonMeet" };

  return {
    title: `${event.title} | DoonMeet Events`,
    description: event.description?.slice(0, 155),
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 155),
      images: event.banner ? [event.banner] : [],
    },
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) notFound();

  const eventDate = new Date(event.date);
  const endsAt = event.endsAt ? new Date(event.endsAt) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: eventDate.toISOString(),
    ...(endsAt && { endDate: endsAt.toISOString() }),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    image: event.banner ? [event.banner] : undefined,
    location: {
      "@type": "Place",
      name: event.location?.name || "Dehradun",
      address: {
        "@type": "PostalAddress",
        streetAddress: event.location?.address || "",
        addressLocality: "Dehradun",
        addressRegion: "Uttarakhand",
        addressCountry: "IN",
      },
    },
    organizer: {
      "@type": "Person",
      name: event.creator?.name || "DoonMeet",
    },
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Banner */}
      <div className="relative h-72 w-full overflow-hidden md:h-96">
        {event.banner ? (
          <Image src={event.banner} alt={event.title} fill priority className="object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgb(var(--primary)) 0%, rgb(var(--primary-light)) 100%)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Back button */}
        <div className="absolute left-6 top-6">
          <Link
            href="/events"
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ArrowLeft size={13} />
            All Events
          </Link>
        </div>

        {/* Date + title overlay */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-end gap-4">
            <div className="flex shrink-0 flex-col items-center rounded-xl bg-white px-3 py-2 shadow-lg">
              <span
                className="text-xs font-bold uppercase"
                style={{ color: "rgb(var(--primary))" }}
              >
                {eventDate.toLocaleDateString("en-IN", { month: "short" })}
              </span>
              <span className="text-2xl font-black leading-none text-gray-900">
                {eventDate.toLocaleDateString("en-IN", { day: "2-digit" })}
              </span>
            </div>
            <div>
              <p className="text-lg font-black text-white leading-tight line-clamp-2">
                {event.title}
              </p>
              <p className="mt-1 text-sm text-white/70">
                {eventDate.toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Left */}
          <div>
            {event.tags?.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {event.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1 text-xs font-semibold capitalize"
                    style={{
                      backgroundColor: "rgb(var(--primary) / 0.1)",
                      color: "rgb(var(--primary))",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h2 className="mb-3 text-xl font-bold">About this event</h2>
            <p
              className="mb-8 leading-relaxed whitespace-pre-line text-sm"
              style={{ color: "rgb(var(--muted))" }}
            >
              {event.description}
            </p>

            {/* Creator */}
            <div
              className="mb-8 flex items-center gap-3 rounded-2xl border p-4"
              style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}
            >
              {event.creator?.avatar ? (
                <Image
                  src={event.creator.avatar}
                  alt={event.creator.name}
                  width={44}
                  height={44}
                  className="rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-base font-bold text-white"
                  style={{ backgroundColor: "rgb(var(--primary))" }}
                >
                  {event.creator?.name?.[0] ?? "D"}
                </div>
              )}
              <div>
                <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                  Organised by
                </p>
                <p className="font-semibold">{event.creator?.name}</p>
              </div>
            </div>

            <EventComments eventId={slug} commentCount={event.commentCount} />
          </div>

          {/* Right — details card */}
          <div className="space-y-4">
            <div
              className="rounded-2xl border p-5 space-y-4"
              style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}
            >
              <h3 className="font-bold">Event Details</h3>

              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "rgb(var(--primary) / 0.1)" }}
                >
                  <CalendarDays size={16} style={{ color: "rgb(var(--primary))" }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
                    Date
                  </p>
                  <p className="text-sm font-semibold">
                    {eventDate.toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "rgb(var(--primary) / 0.1)" }}
                >
                  <Clock size={16} style={{ color: "rgb(var(--primary))" }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
                    Time
                  </p>
                  <p className="text-sm font-semibold">
                    {eventDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    {endsAt &&
                      ` — ${endsAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                </div>
              </div>

              {(event.location?.name || event.location?.address) && (
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgb(var(--primary) / 0.1)" }}
                  >
                    <MapPin size={16} style={{ color: "rgb(var(--primary))" }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
                      Location
                    </p>
                    <p className="text-sm font-semibold">{event.location.name}</p>
                    {event.location.address && (
                      <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                        {event.location.address}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {event.capacity && (
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgb(var(--primary) / 0.1)" }}
                  >
                    <Users size={16} style={{ color: "rgb(var(--primary))" }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
                      Capacity
                    </p>
                    <p className="text-sm font-semibold">{event.capacity} people</p>
                  </div>
                </div>
              )}
            </div>

            <button
              className="w-full rounded-xl border py-3 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--text))" }}
            >
              Share Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
