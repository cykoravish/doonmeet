import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { MapPin, MessageCircle, Calendar, Users, PartyPopper, Star, Mail, UserRound, Pencil } from "lucide-react";
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

  // Ring trick: the box-shadow "border" matches the page background so the
  // avatar reads as cleanly punched through the banner, in both themes.
  const avatarRingStyle = {
    boxShadow:
      "0 0 0 4px rgb(var(--background)), 0 12px 28px -10px rgb(0 0 0 / 0.35)",
  };

  return (
    <div className="min-h-screen">
      {/* Banner — fixed height, fully contained. The decorative ridgeline
          motif and everything inside it is strictly clipped by
          overflow-hidden, so it can never inflate the page layout. */}
      <div className="relative h-40 overflow-hidden sm:h-52 md:h-60 bg-gradient-to-br from-primary via-primary to-primary-light">
        <svg
          aria-hidden="true"
          viewBox="0 0 400 160"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <path
            d="M0,40 C60,10 100,55 160,35 C220,15 260,50 320,30 C350,20 380,35 400,25 V0 H0 Z"
            fill="rgb(255 255 255 / 0.10)"
          />
          <path
            d="M0,80 C50,60 110,95 170,75 C230,55 270,90 330,70 C360,60 385,72 400,65 V0 H0 Z"
            fill="rgb(255 255 255 / 0.07)"
          />
          <path
            d="M0,120 C55,100 115,130 175,112 C235,94 275,125 335,108 C365,99 385,110 400,104 V0 H0 Z"
            fill="rgb(255 255 255 / 0.05)"
          />
        </svg>
        {/* Soft bottom fade so the avatar ring transitions in cleanly */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent" />
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Avatar — the ONLY element pulled up over the banner. Text below
            stays in normal flow so it can never be clipped by the banner,
            no matter how long the name/bio get. */}
        <div className="-mt-14 flex flex-col items-center sm:-mt-16 sm:flex-row sm:items-end">
          <div className="relative z-10 shrink-0">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={144}
                height={144}
                className="h-28 w-28 rounded-full object-cover sm:h-32 sm:w-32 md:h-36 md:w-36"
                style={avatarRingStyle}
              />
            ) : (
              <div
                className="flex h-28 w-28 items-center justify-center rounded-full bg-primary text-4xl font-black text-white sm:h-32 sm:w-32 md:h-36 md:w-36"
                style={avatarRingStyle}
              >
                {user.name[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Edit/Message action — sits beside the avatar on larger screens,
              stays out of the way on mobile where it appears lower down. */}
          <div className="mt-4 hidden sm:ml-auto sm:mb-2 sm:block">
            <ProfileAction isOwnProfile={isOwnProfile} currentUserId={currentUserId} userId={userId} name={user.name} />
          </div>
        </div>

        {/* Identity block — always below the avatar, normal flow. */}
        <div className="mt-4 text-center sm:text-left">
          <h1 className="break-words text-2xl font-black sm:text-3xl">{user.name}</h1>
          {user.bio && (
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted sm:mx-0">
              {user.bio}
            </p>
          )}
        </div>

        {/* Meta row — location + a stamp-style "joined" badge */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          {user.address && (
            <div className="flex items-center gap-1 text-xs text-muted">
              <MapPin size={12} className="shrink-0" />
              <span className="break-words">{user.address}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 rounded-full border border-dashed border-accent/50 px-3 py-1 text-xs font-medium text-accent">
            <Calendar size={12} />
            Exploring Dehradun since {joinedDate}
          </div>
        </div>

        {/* Interests */}
        {user.interests?.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {user.interests.map((i: string) => (
              <span
                key={i}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary"
              >
                {i}
              </span>
            ))}
          </div>
        )}

        {/* Actions — mobile only (desktop version lives beside the avatar) */}
        <div className="mt-5 flex justify-center sm:hidden">
          <ProfileAction isOwnProfile={isOwnProfile} currentUserId={currentUserId} userId={userId} name={user.name} fullWidth />
        </div>

        {/* Activity stats */}
        <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-surface shadow-sm">
          <StatBlock icon={Users} label="Communities" value={user.stats.communities} />
          <StatBlock icon={PartyPopper} label="Events" value={user.stats.events} />
          <StatBlock icon={Star} label="Reviews" value={user.stats.reviews} />
        </div>

        {/* Public info */}
        {(user.gender || user.email) && (
          <div className="mb-10 mt-4 space-y-1 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-bold">About</h2>
            {user.gender && (
              <InfoRow icon={UserRound} label="Gender" value={user.gender.replace("_", " ")} capitalize />
            )}
            {user.email && (
              <InfoRow icon={Mail} label="Email" value={user.email} />
            )}
          </div>
        )}
        {!user.gender && !user.email && <div className="pb-10" />}
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
    <div className="flex flex-col items-center gap-1 px-2 py-4 transition-colors hover:bg-primary/5">
      <Icon size={17} className="text-primary" />
      <span className="text-lg font-black">{value}</span>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  capitalize,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 text-sm last:border-b-0">
      <span className="flex items-center gap-2 text-muted">
        <Icon size={14} className="shrink-0" />
        {label}
      </span>
      <span className={`break-all text-right font-medium ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function ProfileAction({
  isOwnProfile,
  currentUserId,
  userId,
  name,
  fullWidth,
}: {
  isOwnProfile: boolean;
  currentUserId: string | null;
  userId: string;
  name: string;
  fullWidth?: boolean;
}) {
  const widthClass = fullWidth ? "w-full max-w-xs justify-center" : "";

  if (isOwnProfile) {
    return (
      <Link
        href="/profile"
        className={`flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold shadow-sm transition-all hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${widthClass}`}
      >
        <Pencil size={13} />
        Edit Profile
      </Link>
    );
  }

  if (currentUserId) {
    return (
      <Link
        href={`/chat?dm=${userId}`}
        className={`flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${widthClass}`}
      >
        <MessageCircle size={13} />
        Message {name.split(" ")[0]}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className={`flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${widthClass}`}
    >
      <MessageCircle size={13} />
      Send Message
    </Link>
  );
}
