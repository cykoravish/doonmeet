import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Globe, Megaphone, Users } from "lucide-react";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, truncate } from "@/lib/seo";
import { getCommunityBySlug, getCommunityMembers, isUserMember, getCommunityEvents } from "@/lib/communities";
import { getSessionUser } from "@/lib/getSessionUser";
import CategoryIcon from "@/components/shared/CategoryIcon";
import { eventDay, eventMonth, eventShortDate, eventTime } from "@/lib/dates";
import JoinLeaveButton from "@/components/communities/JoinLeaveButton";
import CommunityDiscussion from "@/components/communities/CommunityDiscussion";
import BackLink from "@/components/shared/BackLink";
import UserLink from "@/components/shared/UserLink";
import Avatar from "@/components/ui/Avatar";

interface CommunityPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CommunityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) return { title: "Community Not Found", robots: { index: false, follow: false } };

  const name = community.name as string;
  const description = truncate(
    (community.description as string)?.trim() ||
      `Join ${name}, a ${community.category as string} community in Dehradun on DoonMeet — meet members, join discussions and find events.`
  );

  return pageMetadata({
    title: `${name} — Dehradun Community`,
    description,
    path: `/communities/${slug}`,
    image: ((community.banner as string | null) || (community.icon as string | null)) ?? undefined,
  });
}

export default async function CommunityDetailPage({ params }: CommunityPageProps) {
  const { slug } = await params;
  const [community, currentUser] = await Promise.all([getCommunityBySlug(slug), getSessionUser()]);

  if (!community) notFound();

  const communityId = String(community._id);
  const [members, memberStatus, events] = await Promise.all([
    getCommunityMembers(communityId),
    isUserMember(communityId, currentUser?._id),
    getCommunityEvents(communityId),
  ]);

  const name = community.name as string;
  const category = community.category as string;
  const memberCount = community.memberCount as number;
  const announcement = community.announcement as { text: string | null; updatedAt: string | null } | undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    description: community.description,
    url: absoluteUrl(`/communities/${slug}`),
    ...(community.banner || community.icon
      ? { image: absoluteUrl((community.banner || community.icon) as string) }
      : {}),
    memberOf: { "@type": "Organization", name: "DoonMeet", url: "https://doonmeet.in" },
    location: { "@type": "Place", name: "Dehradun, Uttarakhand, India" },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-3 pb-8 sm:px-6 sm:pt-6">
      <JsonLd
        data={[
          jsonLd,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Communities", path: "/communities" },
            { name, path: `/communities/${slug}` },
          ]),
        ]}
      />

      <BackLink href="/communities" label="All communities" />

      {/* Hero — Join sits right here so it's visible without scrolling on a phone */}
      <header className="rounded-[24px] border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-primary-soft text-primary-fg">
            {community.icon ? (
              <Image
                src={community.icon as string}
                alt=""
                width={64}
                height={64}
                sizes="64px"
                className="h-full w-full object-cover"
              />
            ) : (
              <CategoryIcon category={category} size={30} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-wide text-primary-fg uppercase">{category} community</p>
            <h1 className="mt-0.5 text-[26px] leading-tight font-extrabold wrap-anywhere sm:text-4xl">{name}</h1>
          </div>
        </div>

        {community.description && (
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-text">{community.description as string}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <Users size={16} aria-hidden="true" />
            <strong className="text-text">{memberCount.toLocaleString()}</strong>
            {memberCount === 1 ? "member" : "members"}
          </span>
          <span className="flex items-center gap-1.5">
            <Globe size={16} aria-hidden="true" />
            Public · anyone in Dehradun can join
          </span>
        </div>

        <div className="mt-4 sm:max-w-xs">
          <JoinLeaveButton slug={slug} isMember={memberStatus} isLoggedIn={!!currentUser} />
        </div>
      </header>

      {announcement?.text && (
        <div className="mt-4 flex items-start gap-3 rounded-[20px] bg-accent-soft p-4">
          <Megaphone size={20} className="mt-0.5 shrink-0 text-accent-fg" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-accent-fg">Pinned announcement</p>
            <p className="mt-0.5 text-[15px] wrap-anywhere text-text">{announcement.text}</p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px] lg:gap-8">
        {/* Sidebar first in the DOM so phones see events/members before a long discussion */}
        <aside className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1">
          {events.length > 0 && (
            <section aria-labelledby="community-events-title" className="rounded-[20px] border border-border bg-surface p-4">
              <h2 id="community-events-title" className="mb-3 text-lg font-extrabold">
                Upcoming events
              </h2>
              <ul className="flex flex-col gap-2">
                {events.map((event) => (
                  <li key={String(event._id)}>
                    <Link
                      href={`/events/${event.slug}`}
                      className="flex items-center gap-3 rounded-[14px] p-2 transition-colors hover:bg-surface-2"
                    >
                      <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[12px] bg-primary-soft text-primary-fg">
                        <span className="text-[10px] font-bold uppercase">{eventMonth(event.date as Date)}</span>
                        <span className="text-lg leading-none font-extrabold">{eventDay(event.date as Date)}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-text">{event.title as string}</span>
                        <span className="block truncate text-sm text-muted">
                          {eventShortDate(event.date as Date)} · {eventTime(event.date as Date)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {members.length > 0 && (
            <section aria-labelledby="community-members-title" className="rounded-[20px] border border-border bg-surface p-4">
              <h2 id="community-members-title" className="mb-3 text-lg font-extrabold">
                Members
              </h2>
              <ul className="flex flex-wrap gap-2">
                {members.slice(0, 16).map((m) => {
                  const user = m.user as { _id: string; name: string; avatar: string | null } | null;
                  if (!user) return null;
                  return (
                    <li key={String(m._id)}>
                      <UserLink userId={String(user._id)}>
                        <Avatar name={user.name} src={user.avatar} size={44} labelled />
                      </UserLink>
                    </li>
                  );
                })}
              </ul>
              {memberCount > 16 && <p className="mt-2 text-sm text-muted">+{memberCount - 16} more</p>}
            </section>
          )}
        </aside>

        <section aria-labelledby="community-discussion-title" className="min-w-0 lg:col-start-1 lg:row-start-1">
          <h2 id="community-discussion-title" className="mb-3 text-xl font-extrabold">
            Discussion
          </h2>
          <CommunityDiscussion slug={slug} isMember={memberStatus} isLoggedIn={!!currentUser} />
        </section>
      </div>
    </div>
  );
}
