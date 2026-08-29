import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, CalendarDays, Clock, ArrowLeft, Users } from "lucide-react";
import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { EventRSVP } from "@/models/EventRSVP";
import { getEventBySlug } from "@/lib/events";
import { getSessionUser } from "@/lib/getSessionUser";
import EventComments from "@/components/events/EventComments";
import RSVPButton from "@/components/events/RSVPButton";
import ShareButton from "@/components/events/ShareButton";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Not Found | DoonMeet" };

  const description = (event.description as string)?.slice(0, 155);
  const url = `https://doonmeet.in/events/${slug}`;

  return {
    title: `${event.title} | DoonMeet Events`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: event.title as string,
      description,
      url,
      images: event.banner ? [event.banner as string] : [],
      type: "website",
    },
    twitter: {
      card: event.banner ? "summary_large_image" : "summary",
      title: event.title as string,
      description,
    },
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const [event, currentUser] = await Promise.all([getEventBySlug(slug), getSessionUser()]);

  if (!event) notFound();

  await connectDB();
  const [attendees, totalGoing, isGoing] = await Promise.all([
    EventRSVP.find({ event: event._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("user", "name avatar")
      .lean(),
    EventRSVP.countDocuments({ event: event._id }),
    currentUser
      ? EventRSVP.exists({ event: event._id, user: currentUser._id })
      : Promise.resolve(false),
  ]);

  const eventDate = new Date(event.date as string);
  const endsAt = event.endsAt ? new Date(event.endsAt as string) : null;
  const isFull = !!event.capacity && totalGoing >= (event.capacity as number);

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
      name: (event.location as { name: string })?.name || "Dehradun",
      address: {
        "@type": "PostalAddress",
        streetAddress: (event.location as { address: string })?.address || "",
        addressLocality: "Dehradun",
        addressRegion: "Uttarakhand",
        addressCountry: "IN",
      },
    },
    organizer: {
      "@type": "Person",
      name: (event.creator as { name: string })?.name || "DoonMeet",
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
          <Image src={event.banner as string} alt={event.title as string} fill priority className="object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, rgb(var(--primary)) 0%, rgb(var(--primary-light)) 100%)" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute left-6 top-6">
          <Link
            href="/events"
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ArrowLeft size={13} /> All Events
          </Link>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-end gap-4">
            <div className="flex shrink-0 flex-col items-center rounded-xl bg-white px-3 py-2 shadow-lg">
              <span className="text-xs font-bold uppercase" style={{ color: "rgb(var(--primary))" }}>
                {eventDate.toLocaleDateString("en-IN", { month: "short" })}
              </span>
              <span className="text-2xl font-black leading-none text-gray-900">
                {eventDate.toLocaleDateString("en-IN", { day: "2-digit" })}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-black leading-tight text-white line-clamp-2">{event.title as string}</h1>
              <p className="mt-1 text-sm text-white/70">
                {eventDate.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
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
            {(event.tags as string[])?.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {(event.tags as string[]).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1 text-xs font-semibold capitalize"
                    style={{ backgroundColor: "rgb(var(--primary) / 0.1)", color: "rgb(var(--primary))" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {event.community && (
              <Link
                href={`/communities/${(event.community as { slug: string }).slug}`}
                className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: "rgb(var(--accent) / 0.1)", color: "rgb(var(--accent))" }}
              >
                Hosted by {(event.community as { name: string }).name}
              </Link>
            )}

            <h2 className="mb-3 text-xl font-bold">About this event</h2>
            <p className="mb-8 whitespace-pre-line text-sm leading-relaxed" style={{ color: "rgb(var(--muted))" }}>
              {event.description as string}
            </p>

            <div
              className="mb-8 flex items-center gap-3 rounded-2xl border p-4"
              style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}
            >
              {(event.creator as { avatar: string | null })?.avatar ? (
                <Image
                  src={(event.creator as { avatar: string }).avatar}
                  alt={(event.creator as { name: string }).name}
                  width={44}
                  height={44}
                  className="rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-base font-bold text-white"
                  style={{ backgroundColor: "rgb(var(--primary))" }}
                >
                  {(event.creator as { name: string })?.name?.[0] ?? "D"}
                </div>
              )}
              <div>
                <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>Organised by</p>
                <p className="font-semibold">{(event.creator as { name: string })?.name}</p>
              </div>
            </div>

            {/* Attendees */}
            {attendees.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-3 text-sm font-bold">
                  {totalGoing} {totalGoing === 1 ? "person" : "people"} going
                </h3>
                <div className="flex flex-wrap gap-2">
                  {attendees.map((a) => {
                    const user = a.user as { _id: string; name: string; avatar: string | null };
                    return user.avatar ? (
                      <Image
                        key={String(a._id)}
                        src={user.avatar}
                        alt={user.name}
                        width={36}
                        height={36}
                        title={user.name}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div
                        key={String(a._id)}
                        title={user.name}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: "rgb(var(--primary))" }}
                      >
                        {user.name[0]?.toUpperCase()}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <EventComments eventId={slug} commentCount={event.commentCount as number} />
          </div>

          {/* Right */}
          <div className="space-y-4">
            <div
              className="space-y-4 rounded-2xl border p-5"
              style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}
            >
              <h3 className="font-bold">Event Details</h3>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "rgb(var(--primary) / 0.1)" }}>
                  <CalendarDays size={16} style={{ color: "rgb(var(--primary))" }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>Date</p>
                  <p className="text-sm font-semibold">
                    {eventDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "rgb(var(--primary) / 0.1)" }}>
                  <Clock size={16} style={{ color: "rgb(var(--primary))" }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>Time</p>
                  <p className="text-sm font-semibold">
                    {eventDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    {endsAt && ` — ${endsAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                </div>
              </div>

              {((event.location as { name: string })?.name || (event.location as { address: string })?.address) && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "rgb(var(--primary) / 0.1)" }}>
                    <MapPin size={16} style={{ color: "rgb(var(--primary))" }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>Location</p>
                    <p className="text-sm font-semibold">{(event.location as { name: string }).name}</p>
                    {(event.location as { address: string }).address && (
                      <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                        {(event.location as { address: string }).address}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "rgb(var(--primary) / 0.1)" }}>
                  <Users size={16} style={{ color: "rgb(var(--primary))" }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
                    {event.capacity ? "Spots" : "Attendance"}
                  </p>
                  <p className="text-sm font-semibold">
                    {event.capacity ? `${totalGoing}/${event.capacity} going` : `${totalGoing} going`}
                  </p>
                </div>
              </div>
            </div>

            <RSVPButton
              slug={slug}
              isGoing={!!isGoing}
              isFull={isFull}
              isLoggedIn={!!currentUser}
            />
            <ShareButton title={event.title as string} url={`https://doonmeet.in/events/${slug}`} />
          </div>
        </div>
      </div>
    </div>
  );
}