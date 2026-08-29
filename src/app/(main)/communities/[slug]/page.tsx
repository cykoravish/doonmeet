import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Users, Calendar, Globe, Megaphone } from "lucide-react";
import type { Metadata } from "next";
import { getCommunityBySlug, getCommunityMembers, isUserMember, getCommunityEvents } from "@/lib/communities";
import { getSessionUser } from "@/lib/getSessionUser";
import JoinLeaveButton from "@/components/communities/JoinLeaveButton";
import CommunityDiscussion from "@/components/communities/CommunityDiscussion";

const CATEGORY_ICONS: Record<string, string> = {
  tech: "💻", nature: "🌿", food: "🍜", photography: "📸", sports: "⚽", arts: "🎨", general: "🏙️",
};
const CATEGORY_COLORS: Record<string, string> = {
  tech: "rgb(100 120 220)", nature: "rgb(34 120 80)", food: "rgb(220 80 60)",
  photography: "rgb(160 100 200)", sports: "rgb(194 140 74)", arts: "rgb(220 120 60)",
  general: "rgb(40 160 100)",
};

interface CommunityPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CommunityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) return { title: "Community Not Found | DoonMeet" };

  const description = (community.description as string)?.slice(0, 155);
  const title = `${community.name} | DoonMeet Communities`;
  const url = `https://doonmeet.in/communities/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: community.icon ? [community.icon as string] : [],
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CommunityDetailPage({ params }: CommunityPageProps) {
  const { slug } = await params;
  const [community, currentUser] = await Promise.all([
    getCommunityBySlug(slug),
    getSessionUser(),
  ]);

  if (!community) notFound();

  const communityId = String(community._id);
  const [members, memberStatus, events] = await Promise.all([
    getCommunityMembers(communityId),
    isUserMember(communityId, currentUser?._id),
    getCommunityEvents(communityId),
  ]);

  const color = CATEGORY_COLORS[community.category as string] ?? "rgb(34 120 80)";
  const emoji = CATEGORY_ICONS[community.category as string] ?? "🏙️";
  const announcement = community.announcement as { text: string | null; updatedAt: string | null } | undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: community.name,
    description: community.description,
    url: `https://doonmeet.in/communities/${slug}`,
    memberOf: { "@type": "Organization", name: "DoonMeet", url: "https://doonmeet.in" },
    location: { "@type": "Place", name: "Dehradun, Uttarakhand, India" },
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div
        className="relative overflow-hidden py-16"
        style={{ background: `linear-gradient(135deg, ${color}20 0%, transparent 60%)`, borderBottom: "1px solid rgb(var(--border))" }}
      >
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-5" style={{ backgroundColor: color }} />

        <div className="relative mx-auto max-w-5xl px-6">
          <Link
            href="/communities"
            className="mb-8 flex w-fit items-center gap-1.5 text-sm hover:underline"
            style={{ color: "rgb(var(--muted))" }}
          >
            <ArrowLeft size={14} /> All Communities
          </Link>

          <div className="flex items-start gap-5">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 text-3xl shadow-md"
              style={{ backgroundColor: "rgb(var(--surface))", borderColor: `${color}30` }}
            >
              {community.icon ? (
                <Image src={community.icon as string} alt={community.name as string} width={36} height={36} className="rounded-lg" />
              ) : (
                emoji
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span
                className="mb-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize"
                style={{ backgroundColor: `${color}15`, color }}
              >
                {community.category as string}
              </span>
              <h1 className="mb-2 text-3xl font-black md:text-4xl">{community.name as string}</h1>
              <p className="max-w-xl text-sm leading-relaxed" style={{ color: "rgb(var(--muted))" }}>
                {community.description as string}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-1.5 text-sm">
                  <Users size={15} style={{ color }} />
                  <span className="font-bold">{(community.memberCount as number).toLocaleString()}</span>
                  <span style={{ color: "rgb(var(--muted))" }}>members</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Globe size={15} style={{ color }} />
                  <span style={{ color: "rgb(var(--muted))" }}>Public community</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned announcement */}
      {announcement?.text && (
        <div className="mx-auto max-w-5xl px-6 pt-8">
          <div
            className="flex items-start gap-3 rounded-2xl p-4"
            style={{ backgroundColor: `${color}10`, border: `1px solid ${color}25` }}
          >
            <Megaphone size={18} className="mt-0.5 shrink-0" style={{ color }} />
            <div>
              <p className="text-sm font-semibold" style={{ color }}>Pinned announcement</p>
              <p className="mt-0.5 text-sm" style={{ color: "rgb(var(--text))" }}>{announcement.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Left — main */}
          <div className="space-y-8">
            <div className="rounded-2xl border p-6" style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}>
              <h2 className="mb-4 font-bold">About this community</h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgb(var(--muted))" }}>
                {community.description as string}
              </p>
            </div>

            <div className="rounded-2xl border p-6" style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}>
              <h2 className="mb-4 font-bold">Discussion</h2>
              <CommunityDiscussion
                slug={slug}
                isMember={memberStatus}
                isLoggedIn={!!currentUser}
                color={color}
              />
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Join CTA */}
            <div
              className="rounded-2xl p-5 text-center"
              style={{ background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`, border: `1px solid ${color}20` }}
            >
              <div className="mb-3 text-3xl">{emoji}</div>
              <p className="mb-1 font-bold">{memberStatus ? "You're a member" : "Join this community"}</p>
              <p className="mb-4 text-xs" style={{ color: "rgb(var(--muted))" }}>
                Connect with {(community.memberCount as number).toLocaleString()} members
              </p>
              <JoinLeaveButton
                slug={slug}
                isMember={memberStatus}
                isLoggedIn={!!currentUser}
                color={color}
              />
            </div>

            {/* Members grid */}
            {members.length > 0 && (
              <div className="rounded-2xl border p-5" style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}>
                <h3 className="mb-3 font-bold">Members</h3>
                <div className="flex flex-wrap gap-2">
                  {members.slice(0, 16).map((m) => {
                    const user = m.user as { _id: string; name: string; avatar: string | null };
                    return user.avatar ? (
                      <Image
                        key={String(m._id)}
                        src={user.avatar}
                        alt={user.name}
                        width={36}
                        height={36}
                        title={user.name}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div
                        key={String(m._id)}
                        title={user.name}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {user.name[0]?.toUpperCase()}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming events */}
            {events.length > 0 && (
              <div className="rounded-2xl border p-5" style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold">Upcoming Events</h3>
                  <Link href="/events" className="text-xs hover:underline" style={{ color }}>
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {events.map((event) => (
                    <Link
                      key={String(event._id)}
                      href={`/events/${event.slug}`}
                      className="flex items-start gap-3 rounded-xl p-3 transition-opacity hover:opacity-80"
                      style={{ backgroundColor: "rgb(var(--background))" }}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}15` }}>
                        <Calendar size={14} style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{event.title as string}</p>
                        <p className="mt-0.5 text-xs" style={{ color: "rgb(var(--muted))" }}>
                          {new Date(event.date as string).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          {(event.location as { name: string })?.name ? ` · ${(event.location as { name: string }).name}` : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}