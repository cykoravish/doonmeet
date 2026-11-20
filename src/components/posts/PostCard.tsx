import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Pencil } from "lucide-react";
import UserLink from "@/components/shared/UserLink";
import Avatar from "@/components/ui/Avatar";
import ShareButton from "@/components/events/ShareButton";
import DeletePostButton from "./DeletePostButton";
import { getPostCategory, type PostCategory } from "@/lib/postCategories";

interface Author {
  _id: string;
  name: string;
  avatar: string | null;
}

interface PostCardProps {
  id: string;
  content: string;
  /** Missing on older posts → treated as "other" (no badge). */
  category?: PostCategory | null;
  image: string | null;
  commentCount: number;
  createdAt: string;
  author: Author;
  /** Show Edit/Delete controls — pass true when this is the logged-in user's own post. */
  isOwner?: boolean;
  /** Called after a successful delete so the parent list can drop this card locally. */
  onDeleted?: () => void;
  /** Paid placement — shows a clear "Sponsored" label (ASCI disclosure). */
  sponsored?: boolean;
}

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Long posts are clamped in the feed; show an explicit "Read more" so users
// know there's more (and crawlers get a real link to the full post).
function isLong(content: string) {
  return content.length > 280 || content.split("\n").length > 6;
}

export default function PostCard({
  id,
  content,
  category,
  image,
  commentCount,
  createdAt,
  author,
  isOwner = false,
  onDeleted,
  sponsored = false,
}: PostCardProps) {
  const authorName = author?.name ?? "Deleted User";
  const categoryInfo = category && category !== "other" ? getPostCategory(category) : null;

  return (
    <article
      className={`overflow-hidden rounded-[20px] border bg-surface ${sponsored ? "border-accent/50" : "border-border"}`}
    >
      {sponsored && (
        // Disclosure first, before anything else in the card.
        <p className="flex items-center gap-1.5 bg-accent-soft px-4 py-1.5 text-xs font-bold tracking-wide text-accent-fg uppercase">
          Sponsored
          <span className="font-semibold tracking-normal normal-case">· Paid promotion</span>
        </p>
      )}
      <header className="flex items-center gap-3 px-4 pt-4">
        <UserLink userId={author?._id}>
          <Avatar name={authorName} src={author?.avatar} size={42} />
        </UserLink>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-base font-bold text-text">
            <UserLink userId={author?._id}>{authorName}</UserLink>
          </p>
          <p className="text-[13px] text-muted">
            <time dateTime={createdAt}>{timeAgo(createdAt)}</time>
          </p>
        </div>
        {categoryInfo && (
          <Link
            href={`/posts?category=${categoryInfo.value}`}
            className={`flex h-8 shrink-0 items-center rounded-full px-3 text-xs font-bold ${
              categoryInfo.value === "business" ? "bg-accent-soft text-accent-fg" : "bg-primary-soft text-primary-fg"
            }`}
          >
            {categoryInfo.label}
          </Link>
        )}
      </header>

      <div className="px-4 pt-2.5 pb-3">
        <Link href={`/posts/${id}`} className="block">
          <p className="line-clamp-6 text-[16px] leading-relaxed break-words whitespace-pre-line text-text">
            {content}
          </p>
          {isLong(content) && (
            <span className="mt-1 inline-block text-sm font-semibold text-primary-fg">Read more</span>
          )}
        </Link>
      </div>

      {image && (
        <Link href={`/posts/${id}`} className="relative block aspect-[4/3] w-full bg-surface-2">
          <Image
            src={image}
            alt={`Photo shared by ${authorName}`}
            fill
            sizes="(max-width: 672px) 100vw, 672px"
            className="object-cover"
          />
        </Link>
      )}

      <footer className="flex items-center gap-2 px-3 py-2.5">
        <Link
          href={`/posts/${id}`}
          className="flex h-10 items-center gap-1.5 rounded-[12px] bg-surface-2 px-3 text-sm font-semibold text-text transition-colors hover:bg-border"
          aria-label={`${commentCount} ${commentCount === 1 ? "comment" : "comments"} — open post`}
        >
          <MessageCircle size={18} aria-hidden="true" />
          {commentCount > 0 ? commentCount : "Comment"}
        </Link>
        <ShareButton
          variant="compact"
          title={`${authorName} on DoonMeet`}
          url={`https://doonmeet.in/posts/${id}`}
          label="Share"
        />

        {isOwner && (
          <div className="ml-auto flex items-center gap-1">
            <Link
              href={`/posts/${id}?edit=1`}
              aria-label="Edit post"
              title="Edit post"
              className="flex h-10 w-10 items-center justify-center rounded-[12px] text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <Pencil size={17} aria-hidden="true" />
            </Link>
            <DeletePostButton postId={id} compact onDeleted={onDeleted} />
          </div>
        )}
      </footer>
    </article>
  );
}
