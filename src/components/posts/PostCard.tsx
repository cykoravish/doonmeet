import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Pencil } from "lucide-react";
import UserLink from "@/components/shared/UserLink";
import DeletePostButton from "./DeletePostButton";

interface Author {
  _id: string;
  name: string;
  avatar: string | null;
}

interface PostCardProps {
  id: string;
  content: string;
  image: string | null;
  commentCount: number;
  createdAt: string;
  author: Author;
  /** Show Edit/Delete controls — pass true when this is the logged-in user's own post. */
  isOwner?: boolean;
  /** Called after a successful delete so the parent list can drop this card locally. */
  onDeleted?: () => void;
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

export function Avatar({
  name,
  avatar,
  size = 40,
}: {
  name: string;
  avatar: string | null;
  size?: number;
}) {
  if (avatar) {
    return (
      <Image
        src={avatar}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: "rgb(var(--primary))",
        fontSize: size * 0.4,
      }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

export default function PostCard({
  id,
  content,
  image,
  commentCount,
  createdAt,
  author,
  isOwner = false,
  onDeleted,
}: PostCardProps) {
  return (
    <article
      className="overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-md"
      style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}
    >
      <div className="flex gap-3 p-4 sm:p-5">
        <UserLink userId={author._id}>
          <Avatar name={author.name} avatar={author.avatar} />
        </UserLink>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            <UserLink userId={author._id}>{author.name}</UserLink>{" "}
            <span className="text-xs font-normal" style={{ color: "rgb(var(--muted))" }}>
              · {timeAgo(createdAt)}
            </span>
          </p>
          <Link href={`/posts/${id}`} className="mt-1 block">
            <p className="whitespace-pre-line break-words text-sm leading-relaxed line-clamp-6">
              {content}
            </p>
          </Link>
        </div>
      </div>

      {image && (
        <Link href={`/posts/${id}`} className="relative block h-64 w-full sm:h-80">
          <Image src={image} alt="Post image" fill className="object-cover" />
        </Link>
      )}

      <div
        className="flex items-center justify-between gap-1.5 border-t px-4 py-2.5 text-xs font-medium sm:px-5"
        style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
      >
        <Link href={`/posts/${id}`} className="flex items-center gap-1.5 py-1.5 transition-opacity hover:opacity-70">
          <MessageCircle size={14} />
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </Link>

        {isOwner && (
          <div className="flex items-center gap-1">
            <Link
              href={`/posts/${id}?edit=1`}
              aria-label="Edit post"
              title="Edit post"
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg transition-colors active:opacity-70"
            >
              <Pencil size={14} />
            </Link>
            <DeletePostButton postId={id} compact onDeleted={onDeleted} />
          </div>
        )}
      </div>
    </article>
  );
}
