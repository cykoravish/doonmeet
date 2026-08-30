import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  MessageCircle,
  Calendar,
  Users,
  PartyPopper,
  Star,
  Mail,
  UserRound,
  Pencil,
  Briefcase,
  Globe,
  Cake,
  Compass,
} from "lucide-react";
import type { Metadata } from "next";
import { getPublicUser } from "@/lib/getPublicUser";
import { getSessionUser } from "@/lib/getSessionUser";
import { getPosts } from "@/lib/posts";
import ProfileBanner from "@/components/profile/ProfileBanner";
import PostCard from "@/components/posts/PostCard";

const LOOKING_FOR_LABELS: Record<string, string> = {
  student: "Student",
  working_professional: "Working Professional",
  entrepreneur: "Entrepreneur",
  new_to_dehradun: "New to Dehradun",
  just_exploring: "Just Exploring",
};

const POSTS_PREVIEW_LIMIT = 6;

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
    alternates: { canonical: `https://doonmeet.in/users/${userId}` },
  };
}

export default async function PublicProfilePage({ params }: UserProfilePageProps) {
  const { userId } = await params;

  const [user, currentUser] = await Promise.all([
    getPublicUser(userId),
    getSessionUser(),
  ]);

  if (!user) notFound();

  const posts = await getPosts({ author: userId, limit: POSTS_PREVIEW_LIMIT });

  const currentUserId = currentUser?._id ?? null;
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
      {/* Banner — editable by the owner (upload via hover), falls back to a
          themed decorative gradient when no image has been set. */}
      <ProfileBanner bannerImage={user.bannerImage} editable={isOwnProfile} />

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
            <ProfileAction
              isOwnProfile={isOwnProfile}
              currentUserId={currentUserId}
              userId={userId}
              name={user.name}
            />
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
          <ProfileAction
            isOwnProfile={isOwnProfile}
            currentUserId={currentUserId}
            userId={userId}
            name={user.name}
            fullWidth
          />
        </div>

        {/* Activity stats */}
        <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-surface shadow-sm">
          <StatBlock icon={Users} label="Communities" value={user.stats.communities} />
          <StatBlock icon={PartyPopper} label="Events" value={user.stats.events} />
          <StatBlock icon={Star} label="Reviews" value={user.stats.reviews} />
        </div>

        {/* Public info */}
        {(user.gender || user.email || user.occupation || user.website || user.dob || user.lookingFor) && (
          <div className="mb-10 mt-4 space-y-1 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-bold">About</h2>
            {user.occupation && (
              <InfoRow icon={Briefcase} label="Occupation" value={user.occupation} />
            )}
            {user.lookingFor && LOOKING_FOR_LABELS[user.lookingFor] && (
              <InfoRow icon={Compass} label="Vibe" value={LOOKING_FOR_LABELS[user.lookingFor]} />
            )}
            {user.gender && (
              <InfoRow icon={UserRound} label="Gender" value={user.gender.replace("_", " ")} capitalize />
            )}
            {user.dob && (
              <InfoRow
                icon={Cake}
                label="Birthday"
                value={new Date(user.dob).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
            )}
            {user.website && (
              <InfoRow
                icon={Globe}
                label="Website"
                value={user.website.replace(/^https?:\/\//, "")}
                href={user.website}
              />
            )}
            {user.email && (
              <InfoRow icon={Mail} label="Email" value={user.email} />
            )}
          </div>
        )}
        {/* Posts */}
        {posts.length > 0 && (
          <div className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold">Posts</h2>
              {posts.length === POSTS_PREVIEW_LIMIT && (
                <Link
                  href={`/posts?author=${userId}`}
                  className="text-xs font-semibold"
                  style={{ color: "rgb(var(--primary))" }}
                >
                  View all
                </Link>
              )}
            </div>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  id={post._id}
                  content={post.content}
                  image={post.image}
                  commentCount={post.commentCount}
                  createdAt={post.createdAt}
                  author={post.author}
                  isOwner={isOwnProfile}
                />
              ))}
            </div>
          </div>
        )}

        {!user.gender && !user.email && !user.occupation && !user.website && !user.dob && !user.lookingFor && posts.length === 0 && (
          <div className="pb-10" />
        )}
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
  href,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  capitalize?: boolean;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 text-sm last:border-b-0">
      <span className="flex items-center gap-2 text-muted">
        <Icon size={14} className="shrink-0" />
        {label}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="break-all text-right font-medium text-primary hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className={`break-all text-right font-medium ${capitalize ? "capitalize" : ""}`}>
          {value}
        </span>
      )}
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
