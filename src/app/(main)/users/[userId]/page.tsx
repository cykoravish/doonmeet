import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { MapPin, MessageCircle, Calendar, Users, PartyPopper, Star } from "lucide-react";
import type { Metadata } from "next";
import { getPublicUser } from "@/lib/getPublicUser";

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.ACCESS_TOKEN_SECRET
);

async function getCurrentUserId() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
    return (payload.userId as string) ?? null;
  } catch {
    return null;
  }
}

interface UserProfilePageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({
  params,
}: UserProfilePageProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await getPublicUser(userId);
  if (!user) return { title: "User Not Found | DoonMeet" };
  return {
    title: `${user.name} | DoonMeet`,
    description: user.bio || `${user.name}'s profile on DoonMeet`,
  };
}

export default async function PublicProfilePage({ params }: UserProfilePageProps) {
  const { userId } = await params;

  const [user, currentUserId] = await Promise.all([
    getPublicUser(userId),
    getCurrentUserId(),
  ]);

  if (!user) notFound();

  const isOwnProfile = currentUserId === userId;
  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const avatarRingStyle = { boxShadow: "0 0 0 4px rgb(var(--background))" };

  return (
    <div className="min-h-screen">
      {/* Banner — contour lines echo the Doon Valley's ridgelines, tying the
          profile back to the map/locations identity used across the app. */}
      <div
        className="relative h-36 overflow-hidden sm:h-44"
        style={{ backgroundColor: "rgb(var(--primary))" }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 400 160"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <path
            d="M0,40 C60,10 100,55 160,35 C220,15 260,50 320,30 C350,20 380,35 400,25 V0 H0 Z"
            fill="rgb(255 255 255 / 0.08)"
          />
          <path
            d="M0,80 C50,60 110,95 170,75 C230,55 270,90 330,70 C360,60 385,72 400,65 V0 H0 Z"
            fill="rgb(255 255 255 / 0.06)"
          />
          <path
            d="M0,120 C55,100 115,130 175,112 C235,94 275,125 335,108 C365,99 385,110 400,104 V0 H0 Z"
            fill="rgb(255 255 255 / 0.05)"
          />
        </svg>
      </div>

      <div className="mx-auto max-w-2xl px-6">
        {/* Identity block — avatar overlaps the banner like a trail marker
            planted on the ridgeline. */}
        <div className="-mt-12 flex flex-col items-center text-center sm:-mt-14 sm:flex-row sm:items-end sm:text-left">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={104}
              height={104}
              className="h-24 w-24 shrink-0 rounded-full object-cover sm:h-28 sm:w-28"
              style={avatarRingStyle}
            />
          ) : (
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-3xl font-black text-white sm:h-28 sm:w-28"
              style={{ backgroundColor: "rgb(var(--primary))", ...avatarRingStyle }}
            >
              {user.name[0]?.toUpperCase()}
            </div>
          )}

          <div className="mt-3 flex-1 sm:mb-1 sm:ml-5 sm:mt-0">
            <h1 className="text-2xl font-black">{user.name}</h1>
            {user.bio && (
              <p
                className="mt-1 text-sm leading-relaxed"
                style={{ color: "rgb(var(--muted))" }}
              >
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Meta row — location + a stamp-style "joined" badge */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          {user.address && (
            <div
              className="flex items-center gap-1 text-xs"
              style={{ color: "rgb(var(--muted))" }}
            >
              <MapPin size={11} />
              {user.address}
            </div>
          )}
          <div
            className="flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs font-medium"
            style={{ borderColor: "rgb(var(--accent) / 0.5)", color: "rgb(var(--accent))" }}
          >
            <Calendar size={11} />
            Exploring Dehradun since {joinedDate}
          </div>
        </div>

        {/* Interests */}
        {user.interests?.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {user.interests.map((i: string) => (
              <span
                key={i}
                className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                style={{
                  backgroundColor: "rgb(var(--primary) / 0.1)",
                  color: "rgb(var(--primary))",
                }}
              >
                {i}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
          {isOwnProfile ? (
            <Link
              href="/profile"
              className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
              style={{ borderColor: "rgb(var(--border))" }}
            >
              Edit Profile
            </Link>
          ) : currentUserId ? (
            <StartDMButton recipientId={userId} recipientName={user.name} />
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
              style={{ backgroundColor: "rgb(var(--primary))" }}
            >
              <MessageCircle size={13} />
              Send Message
            </Link>
          )}
        </div>

        {/* Activity stats — a real footprint of this person's presence on
            DoonMeet, not decoration. */}
        <div
          className="mt-6 grid grid-cols-3 divide-x rounded-2xl border"
          style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}
        >
          <StatBlock icon={Users} label="Communities" value={user.stats.communities} />
          <StatBlock icon={PartyPopper} label="Events" value={user.stats.events} />
          <StatBlock icon={Star} label="Reviews" value={user.stats.reviews} />
        </div>

        {/* Public info */}
        {(user.gender || user.email) && (
          <div
            className="mb-8 mt-4 rounded-2xl border p-5 space-y-3"
            style={{
              borderColor: "rgb(var(--border))",
              backgroundColor: "rgb(var(--surface))",
            }}
          >
            <h2 className="text-sm font-bold">About</h2>
            {user.gender && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "rgb(var(--muted))" }}>Gender</span>
                <span className="font-medium capitalize">{user.gender.replace("_", " ")}</span>
              </div>
            )}
            {user.email && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "rgb(var(--muted))" }}>Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
            )}
          </div>
        )}
        {!user.gender && !user.email && <div className="pb-8" />}
      </div>
    </div>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 py-4">
      <Icon size={16} style={{ color: "rgb(var(--primary))" }} />
      <span className="text-lg font-black">{value}</span>
      <span className="text-[11px]" style={{ color: "rgb(var(--muted))" }}>
        {label}
      </span>
    </div>
  );
}

// Static link — no client interactivity needed yet, so this stays server-rendered.
function StartDMButton({ recipientId, recipientName }: { recipientId: string; recipientName: string }) {
  return (
    <Link
      href={`/chat?dm=${recipientId}`}
      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
      style={{ backgroundColor: "rgb(var(--primary))" }}
    >
      <MessageCircle size={13} />
      Message {recipientName.split(" ")[0]}
    </Link>
  );
}
