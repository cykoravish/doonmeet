import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  MessageCircle,
  CalendarHeart,
  UserRound,
  Pencil,
  Globe,
  Cake,
  Mail,
  Phone,
  Sparkles,
  Users,
  ChevronRight,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getPublicUser } from "@/lib/getPublicUser";
import { getSessionUser } from "@/lib/getSessionUser";
import { getPosts } from "@/lib/posts";
import {
  activityLabel,
  getSharedCommunityIds,
  getUserCommunities,
  sharedInterests,
  type ProfileCommunity,
} from "@/lib/profile";
import { CATEGORY_ICONS } from "@/lib/communityCategories";
import SupporterBadge from "@/components/support/SupporterBadge";
import ProfileBanner from "@/components/profile/ProfileBanner";
import PhotoViewButton from "@/components/ui/PhotoViewButton";
import { buttonClasses } from "@/components/ui/Button";
import ProfileSafetyMenu from "@/components/safety/ProfileSafetyMenu";
import PostCard from "@/components/posts/PostCard";

const LOOKING_FOR_LABELS: Record<string, string> = {
  student: "Student",
  working_professional: "Working professional",
  entrepreneur: "Entrepreneur",
  new_to_dehradun: "New to Dehradun",
  just_exploring: "Just exploring",
};

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

const POSTS_PREVIEW_LIMIT = 6;

interface PublicProfile {
  _id: string;
  name: string;
  avatar: string | null;
  bannerImage: string | null;
  bio: string;
  occupation: string;
  website: string;
  lookingFor: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  isOnline: boolean;
  isSupporter: boolean;
  stats: { communities: number; events: number; reviews: number };
  gender?: string | null;
  address?: string;
  interests?: string[];
  email?: string | null;
  phone?: string | null;
  birthday?: string;
}

interface UserProfilePageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await getPublicUser(userId);
  if (!user) return { title: "User Not Found", robots: { index: false, follow: false } };
  // Member profiles are personal pages — robots.txt blocks crawling them and
  // this keeps them out of results even if someone links to one.
  return {
    title: user.name,
    description: user.bio || `${user.name}'s profile on DoonMeet`,
    robots: { index: false, follow: true },
  };
}

export default async function PublicProfilePage({ params }: UserProfilePageProps) {
  const { userId } = await params;

  const [user, currentUser] = (await Promise.all([getPublicUser(userId), getSessionUser()])) as [
    PublicProfile | null,
    { _id: string; interests?: string[] } | null,
  ];
  if (!user) notFound();

  const currentUserId = currentUser?._id ?? null;
  const isOwnProfile = currentUserId === userId;
  const isVisitor = !!currentUserId && !isOwnProfile;

  const [posts, communities] = await Promise.all([
    getPosts({ author: userId, limit: POSTS_PREVIEW_LIMIT, viewerId: currentUserId }),
    getUserCommunities(userId),
  ]);

  // "In common" — only for a logged-in visitor looking at someone else.
  const commonInterests = isVisitor ? sharedInterests(user.interests, currentUser?.interests) : [];
  const sharedIds = isVisitor
    ? await getSharedCommunityIds(currentUserId!, communities.map((c) => c._id))
    : new Set<string>();
  const commonCommunities = communities.filter((c) => sharedIds.has(c._id));
  const commonInterestSet = new Set(commonInterests);

  // Presence is shown to logged-in members only (same as the chat's member list).
  const activity = currentUserId ? activityLabel(user.isOnline, user.lastSeenAt) : null;

  const firstName = user.name.split(" ")[0] || user.name;
  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const tagline = [user.occupation, user.lookingFor ? LOOKING_FOR_LABELS[user.lookingFor] : null]
    .filter(Boolean)
    .join(" · ");

  const statParts = [
    plural(user.stats.communities, "community", "communities"),
    plural(user.stats.events, "event joined", "events joined"),
    plural(user.stats.reviews, "place review", "place reviews"),
  ].filter(Boolean);

  const genderLabel = user.gender ? GENDER_LABELS[user.gender] : null;
  const hasDetails = !!(genderLabel || user.birthday || user.website || user.email || user.phone);

  // Ring trick: the box-shadow "border" matches the page background so the
  // avatar reads as cleanly punched through the banner, in both themes.
  const avatarRingStyle = {
    boxShadow: "0 0 0 4px rgb(var(--background)), 0 10px 24px -12px rgb(0 0 0 / 0.4)",
  };

  return (
    <div className="min-h-screen">
      <ProfileBanner bannerImage={user.bannerImage} editable={isOwnProfile} />

      {/* Mobile visitors get a fixed action bar at the bottom — keep the
          last section clear of it. */}
      <div className={`mx-auto max-w-2xl px-4 sm:px-6 ${isOwnProfile ? "pb-10" : "pb-28 md:pb-12"}`}>
        {/* ---------- Header: avatar (+ desktop actions) ---------- */}
        <div className="-mt-12 flex items-end justify-between gap-3 sm:-mt-14">
          <div className="relative z-10 shrink-0">
            {user.avatar ? (
              <PhotoViewButton src={user.avatar} name={user.name} className="block">
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={128}
                  height={128}
                  sizes="(min-width: 640px) 128px, 104px"
                  className="h-26 w-26 rounded-full object-cover sm:h-32 sm:w-32"
                  style={avatarRingStyle}
                />
              </PhotoViewButton>
            ) : (
              <div
                className="flex h-26 w-26 items-center justify-center rounded-full bg-primary-soft font-display text-4xl font-extrabold text-primary-fg sm:h-32 sm:w-32"
                style={avatarRingStyle}
                aria-hidden="true"
              >
                {user.name[0]?.toUpperCase()}
              </div>
            )}
            {activity?.online && (
              <span
                className="absolute right-1.5 bottom-1.5 h-5 w-5 rounded-full border-[3px] border-background bg-online sm:right-2 sm:bottom-2"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="mb-1 hidden md:block">
            <ProfileAction
              isOwnProfile={isOwnProfile}
              currentUserId={currentUserId}
              userId={userId}
              name={user.name}
            />
          </div>
        </div>

        {/* ---------- Identity ---------- */}
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <h1 className="font-display text-[28px] leading-tight font-extrabold wrap-anywhere sm:text-[34px]">
              {user.name}
            </h1>
            {user.isSupporter && <SupporterBadge />}
          </div>

          {tagline && <p className="mt-1 text-[16px] font-semibold text-text/80">{tagline}</p>}

          {(user.address || activity) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[15px] text-muted">
              {user.address && (
                <span className="flex min-w-0 items-center gap-1.5">
                  <MapPin size={16} className="shrink-0" aria-hidden="true" />
                  <span className="wrap-anywhere">{user.address}</span>
                </span>
              )}
              {activity && (
                <span
                  className={`flex items-center gap-1.5 ${activity.online ? "font-semibold text-primary-fg" : ""}`}
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${activity.online ? "bg-online" : "bg-muted/50"}`}
                    aria-hidden="true"
                  />
                  {activity.text}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Own profile on mobile: edit button inline (no bottom bar). */}
        {isOwnProfile && (
          <div className="mt-4 md:hidden">
            <ProfileAction
              isOwnProfile
              currentUserId={currentUserId}
              userId={userId}
              name={user.name}
              fullWidth
            />
          </div>
        )}

        {/* ---------- In common ---------- */}
        {(commonInterests.length > 0 || commonCommunities.length > 0) && (
          <section
            aria-labelledby="in-common"
            className="mt-5 rounded-[20px] border border-primary/20 bg-primary-soft p-4"
          >
            <h2 id="in-common" className="flex items-center gap-2 text-[16px] font-extrabold text-primary-fg">
              <Sparkles size={18} aria-hidden="true" />
              In common with you
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {commonInterests.map((i) => (
                <span
                  key={i}
                  className="inline-flex h-8 items-center rounded-full bg-surface px-3 text-sm font-semibold capitalize text-text"
                >
                  {i}
                </span>
              ))}
              {commonCommunities.map((c) => (
                <CommunityChip key={c._id} community={c} tone="surface" />
              ))}
            </div>
            <p className="mt-3 text-sm text-text/75">A good reason to say hello 👋</p>
          </section>
        )}

        {/* ---------- Bio + interests ---------- */}
        {(user.bio || (user.interests?.length ?? 0) > 0) && (
          <section aria-label={`About ${firstName}`} className="mt-5">
            {user.bio && (
              <p className="text-[16px] leading-relaxed whitespace-pre-line wrap-anywhere text-text">
                {user.bio}
              </p>
            )}
            {(user.interests?.length ?? 0) > 0 && (
              <ul className={`flex flex-wrap gap-2 ${user.bio ? "mt-3" : ""}`} aria-label="Interests">
                {user.interests!.map((i) => (
                  <li
                    key={i}
                    className={`inline-flex h-8 items-center rounded-full px-3 text-sm font-semibold capitalize ${
                      commonInterestSet.has(i)
                        ? "bg-primary text-on-primary"
                        : "bg-surface-2 text-text"
                    }`}
                  >
                    {i}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ---------- Quick facts ---------- */}
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] text-muted">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 font-semibold text-accent-fg">
            <CalendarHeart size={15} aria-hidden="true" />
            Exploring Dehradun since {joinedDate}
          </span>
          {statParts.length > 0 && <span>{statParts.join(" · ")}</span>}
        </div>

        {/* ---------- Posts ---------- */}
        <section aria-labelledby="posts-heading" className="mt-8">
          <SectionHeading id="posts-heading" title="Posts">
            {posts.length === POSTS_PREVIEW_LIMIT && (
              <Link
                href={`/posts?author=${userId}`}
                className="flex min-h-11 items-center gap-0.5 text-sm font-semibold text-primary-fg hover:underline"
              >
                View all
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            )}
          </SectionHeading>

          {posts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  id={post._id}
                  content={post.content}
                  category={post.category}
                  image={post.image}
                  commentCount={post.commentCount}
                  imageWidth={post.imageWidth}
                  imageHeight={post.imageHeight}
                  likeCount={post.likeCount}
                  likedByMe={post.likedByMe}
                  canLike={!!currentUserId}
                  createdAt={post.createdAt}
                  author={post.author}
                  isOwner={isOwnProfile}
                />
              ))}
            </div>
          ) : (
            <EmptyNote
              icon={NotebookPen}
              text={
                isOwnProfile
                  ? "You haven't posted anything yet."
                  : `${firstName} hasn't posted anything yet.`
              }
              action={
                isOwnProfile
                  ? { href: "/posts?compose=1", label: "Write your first post" }
                  : isVisitor
                    ? { href: `/chat?dm=${userId}`, label: `Say hello to ${firstName}` }
                    : null
              }
            />
          )}
        </section>

        {/* ---------- Communities ---------- */}
        {communities.length > 0 && (
          <section aria-labelledby="communities-heading" className="mt-8">
            <SectionHeading id="communities-heading" title="Communities" />
            <div className="flex flex-wrap gap-2">
              {communities.map((c) => (
                <CommunityChip key={c._id} community={c} tone={sharedIds.has(c._id) ? "primary" : "neutral"} />
              ))}
            </div>
          </section>
        )}

        {/* ---------- More about ---------- */}
        {hasDetails && (
          <section aria-labelledby="details-heading" className="mt-8">
            <SectionHeading id="details-heading" title={`More about ${firstName}`} />
            <ul className="divide-y divide-border rounded-[20px] border border-border bg-surface px-4">
              {genderLabel && <DetailItem icon={UserRound} text={genderLabel} />}
              {user.birthday && <DetailItem icon={Cake} text={`Birthday on ${user.birthday}`} />}
              {user.website && (
                <DetailItem
                  icon={Globe}
                  text={user.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  href={user.website}
                />
              )}
              {user.email && <DetailItem icon={Mail} text={user.email} href={`mailto:${user.email}`} />}
              {user.phone && <DetailItem icon={Phone} text={user.phone} href={`tel:${user.phone}`} />}
            </ul>
          </section>
        )}
      </div>

      {/* ---------- Mobile action bar (visitors + guests) ----------
          Sits just above the bottom navigation so "Message" is always one
          thumb-tap away while scrolling. Solid background (no blur) to stay
          cheap on low-end phones. */}
      {!isOwnProfile && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-surface px-4 py-2.5 md:hidden">
          <ProfileAction
            isOwnProfile={false}
            currentUserId={currentUserId}
            userId={userId}
            name={user.name}
            fullWidth
            menuPlacement="up"
          />
        </div>
      )}
    </div>
  );
}

function plural(n: number, one: string, many: string): string | null {
  if (!n) return null;
  return `${n} ${n === 1 ? one : many}`;
}

function SectionHeading({ id, title, children }: { id: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
      <h2 id={id} className="font-display text-xl font-extrabold">
        {title}
      </h2>
      {children}
    </div>
  );
}

function CommunityChip({
  community,
  tone,
}: {
  community: ProfileCommunity;
  tone: "neutral" | "primary" | "surface";
}) {
  const Icon = CATEGORY_ICONS[community.category] ?? Users;
  const toneClass =
    tone === "primary"
      ? "bg-primary-soft text-primary-fg"
      : tone === "surface"
        ? "bg-surface text-text"
        : "border border-border bg-surface text-text";
  return (
    <Link
      href={`/communities/${community.slug}`}
      className={`inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary-fg ${toneClass}`}
    >
      <Icon size={15} className="shrink-0" aria-hidden="true" />
      <span className="truncate">{community.name}</span>
    </Link>
  );
}

function DetailItem({ icon: Icon, text, href }: { icon: LucideIcon; text: string; href?: string }) {
  const content = (
    <>
      <Icon size={18} className="shrink-0 text-muted" aria-hidden="true" />
      <span className="min-w-0 break-all">{text}</span>
    </>
  );
  return (
    <li>
      {href ? (
        <a
          href={href}
          target={/^(mailto|tel):/.test(href) ? undefined : "_blank"}
          rel="noopener noreferrer nofollow"
          className="flex min-h-12 items-center gap-3 py-2.5 text-[15px] font-medium text-primary-fg hover:underline"
        >
          {content}
        </a>
      ) : (
        <div className="flex min-h-12 items-center gap-3 py-2.5 text-[15px] font-medium">{content}</div>
      )}
    </li>
  );
}

function EmptyNote({
  icon: Icon,
  text,
  action,
}: {
  icon: LucideIcon;
  text: string;
  action: { href: string; label: string } | null;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border px-4 py-8 text-center">
      <Icon size={26} className="text-muted" aria-hidden="true" />
      <p className="text-[15px] text-muted">{text}</p>
      {action && (
        <Link href={action.href} className={buttonClasses("secondary", "md")}>
          {action.label}
        </Link>
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
  menuPlacement = "down",
}: {
  isOwnProfile: boolean;
  currentUserId: string | null;
  userId: string;
  name: string;
  fullWidth?: boolean;
  menuPlacement?: "down" | "up";
}) {
  const widthClass = fullWidth ? "w-full" : "";

  if (isOwnProfile) {
    return (
      <Link href="/profile" className={buttonClasses("secondary", "md", widthClass)}>
        <Pencil size={17} aria-hidden="true" />
        Edit profile
      </Link>
    );
  }

  if (currentUserId) {
    // Message + a ⋯ menu for Report / Block.
    return (
      <div className={`flex items-center gap-2 ${widthClass}`}>
        <Link
          href={`/chat?dm=${userId}`}
          className={buttonClasses("primary", "md", fullWidth ? "min-w-0 flex-1" : "")}
        >
          <MessageCircle size={17} aria-hidden="true" />
          <span className="truncate">Message {name.split(" ")[0]}</span>
        </Link>
        <ProfileSafetyMenu user={{ _id: userId, name }} placement={menuPlacement} />
      </div>
    );
  }

  return (
    <Link href={`/login?redirect=/users/${userId}`} className={buttonClasses("primary", "md", widthClass)}>
      <MessageCircle size={17} aria-hidden="true" />
      Log in to message
    </Link>
  );
}
