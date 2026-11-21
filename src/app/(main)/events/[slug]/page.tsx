import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, ExternalLink, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { EventRSVP } from "@/models/EventRSVP";
import { getEventBySlug } from "@/lib/events";
import { getSessionUser } from "@/lib/getSessionUser";
import { eventLongDate, eventTime, mapsSearchUrl } from "@/lib/dates";
import EventComments from "@/components/events/EventComments";
import RSVPButton from "@/components/events/RSVPButton";
import ShareButton from "@/components/events/ShareButton";
import BackLink from "@/components/shared/BackLink";
import UserLink from "@/components/shared/UserLink";
import Avatar from "@/components/ui/Avatar";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE, pageMetadata, truncate } from "@/lib/seo";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Not Found", robots: { index: false, follow: false } };

  // Lead with the date and venue — that's what people scan for in results.
  const when = new Date(event.date as string).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const venue = (event.location as { name?: string } | undefined)?.name;
  const description = truncate(`${when}${venue ? ` · ${venue}` : ""}. ${event.description as string}`);

  return pageMetadata({
    title: `${event.title as string} — Event in Dehradun`,
    description,
    path: `/events/${slug}`,
    image: (event.banner as string | null) ?? undefined,
  });
}

interface Person {
  _id: string;
  name: string;
  avatar: string | null;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const [event, currentUser] = await Promise.all([getEventBySlug(slug), getSessionUser()]);

  if (!event) notFound();

  await connectDB();
  const [attendees, totalGoing, isGoing] = await Promise.all([
    EventRSVP.find({ event: event._id }).sort({ createdAt: -1 }).limit(20).populate("user", "name avatar").lean(),
    EventRSVP.countDocuments({ event: event._id }),
    currentUser ? EventRSVP.exists({ event: event._id, user: currentUser._id }) : Promise.resolve(false),
  ]);

  const title = event.title as string;
  const eventDate = new Date(event.date as string);
  const endsAt = event.endsAt ? new Date(event.endsAt as string) : null;
  const capacity = (event.capacity as number | null) ?? null;
  const isFull = !!capacity && totalGoing >= capacity;
  const location = (event.location as { name?: string; address?: string } | undefined) ?? {};
  const creator = event.creator as Person | null;
  const community = event.community as { name: string; slug: string } | null;
  const tags = (event.tags as string[]) ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    url: absoluteUrl(`/events/${slug}`),
    description: event.description,
    startDate: eventDate.toISOString(),
    ...(endsAt && { endDate: endsAt.toISOString() }),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    image: [absoluteUrl((event.banner as string | null) ?? DEFAULT_OG_IMAGE)],
    ...(capacity ? { maximumAttendeeCapacity: capacity } : {}),
    location: {
      "@type": "Place",
      name: location.name || "Dehradun",
      address: {
        "@type": "PostalAddress",
        streetAddress: location.address || "",
        addressLocality: "Dehradun",
        addressRegion: "Uttarakhand",
        addressCountry: "IN",
      },
    },
    organizer: { "@type": "Person", name: creator?.name || "DoonMeet" },
  };

  const facts = [
    { icon: CalendarDays, label: "Date", value: eventLongDate(eventDate) },
    {
      icon: Clock,
      label: "Time",
      value: `${eventTime(eventDate)}${endsAt ? ` – ${eventTime(endsAt)}` : ""}`,
    },
    {
      icon: Users,
      label: capacity ? "Spots" : "Going",
      value: capacity ? `${totalGoing} of ${capacity} going` : `${totalGoing} going`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pt-3 pb-8 sm:px-6 sm:pt-6">
      <JsonLd
        data={[
          jsonLd,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
            { name: title, path: `/events/${slug}` },
          ]),
        ]}
      />

      <BackLink href="/events" label="All events" />

      {/* Banner — title sits below it in normal flow (readable, no overlay text) */}
      <div className="relative aspect-[16/9] max-h-[420px] w-full overflow-hidden rounded-[20px] bg-primary-soft">
        {event.banner ? (
          <Image
            src={event.banner as string}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-primary-fg" aria-hidden="true">
            <CalendarDays size={56} strokeWidth={1.5} />
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
        {/* Title block */}
        <header className="lg:col-start-1">
          {(tags.length > 0 || community) && (
            <div className="mb-2 flex flex-wrap gap-2">
              {community && (
                <Link
                  href={`/communities/${community.slug}`}
                  className="inline-flex h-8 items-center rounded-full bg-accent-soft px-3 text-sm font-semibold text-accent-fg"
                >
                  By {community.name}
                </Link>
              )}
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex h-8 items-center rounded-full bg-primary-soft px-3 text-sm font-semibold text-primary-fg capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-[28px] leading-tight font-extrabold wrap-anywhere sm:text-4xl">{title}</h1>
          <p className="mt-1 text-[15px] font-semibold text-primary-fg">
            {eventLongDate(eventDate)} · {eventTime(eventDate)}
          </p>
        </header>

        {/* Key facts + RSVP — straight after the title on phones, sticky sidebar on desktop */}
        <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="flex flex-col gap-3 lg:sticky lg:top-24">
            <div className="rounded-[20px] border border-border bg-surface p-4">
              <ul className="flex flex-col gap-3.5">
                {facts.map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary-soft text-primary-fg">
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] text-muted">{label}</span>
                      <span className="block font-semibold text-text">{value}</span>
                    </span>
                  </li>
                ))}
                {(location.name || location.address) && (
                  <li className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary-soft text-primary-fg">
                      <MapPin size={19} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] text-muted">Where</span>
                      <span className="block font-semibold wrap-anywhere text-text">
                        {location.name || location.address}
                      </span>
                      {location.name && location.address && (
                        <span className="block text-sm wrap-anywhere text-muted">{location.address}</span>
                      )}
                      <a
                        href={mapsSearchUrl(location.name, location.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary-fg hover:underline"
                      >
                        Open in Maps <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    </span>
                  </li>
                )}
              </ul>
            </div>

            <RSVPButton slug={slug} isGoing={!!isGoing} isFull={isFull} isLoggedIn={!!currentUser} />
            <ShareButton title={title} url={`https://doonmeet.in/events/${slug}`} label="Share event" />
          </div>
        </aside>

        {/* Details */}
        <div className="flex min-w-0 flex-col gap-7 lg:col-start-1">
          <section aria-labelledby="event-about-title">
            <h2 id="event-about-title" className="mb-2 text-xl font-extrabold">
              About this event
            </h2>
            <p className="text-[16px] leading-relaxed wrap-anywhere whitespace-pre-line text-text">
              {event.description as string}
            </p>
          </section>

          {creator && (
            <UserLink userId={creator._id} className="block">
              <span className="flex items-center gap-3 rounded-[20px] border border-border bg-surface p-3.5">
                <Avatar name={creator.name} src={creator.avatar} size={48} />
                <span className="min-w-0">
                  <span className="block text-[13px] text-muted">Hosted by</span>
                  <span className="block truncate font-bold text-text">{creator.name}</span>
                </span>
              </span>
            </UserLink>
          )}

          {attendees.length > 0 && (
            <section aria-labelledby="event-going-title">
              <h2 id="event-going-title" className="mb-3 text-xl font-extrabold">
                {totalGoing} {totalGoing === 1 ? "person" : "people"} going
              </h2>
              <ul className="flex flex-wrap gap-2">
                {attendees.map((a) => {
                  const user = a.user as Person | null;
                  if (!user) return null;
                  return (
                    <li key={String(a._id)}>
                      <UserLink userId={String(user._id)}>
                        <Avatar name={user.name} src={user.avatar} size={44} labelled />
                      </UserLink>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <EventComments eventId={slug} commentCount={event.commentCount as number} isLoggedIn={!!currentUser} />
        </div>
      </div>
    </div>
  );
}
