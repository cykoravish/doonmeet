"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Pencil } from "lucide-react";
import { COMMENT_COUNT_EVENT } from "./commentEvents";
import LikeButton from "./LikeButton";
import PostImage from "./PostImage";
import UserLink from "@/components/shared/UserLink";
import Avatar from "@/components/ui/Avatar";
import { buttonClasses } from "@/components/ui/Button";
import { timeAgo } from "./PostCard";
import { categoryFeedPath } from "@/data/categoryLandings";
import EditPostForm from "./EditPostForm";
import ShareButton from "@/components/events/ShareButton";
import DeletePostButton from "./DeletePostButton";
import { getPostCategory, type PostCategory } from "@/lib/postCategories";
import Link from "next/link";
import PromoteButton from "@/components/promotions/PromoteButton";
import { PROMOTION_PLAN_LABEL } from "@/lib/promotionPlans";

interface Author {
  _id: string;
  name: string;
  avatar: string | null;
}

interface PostDetailViewProps {
  postId: string;
  initialContent: string;
  initialImage: string | null;
  initialImageWidth?: number | null;
  initialImageHeight?: number | null;
  initialCategory?: PostCategory | null;
  commentCount: number;
  likeCount: number;
  likedByMe: boolean;
  /** Logged-in viewer (can ❤️ and comment). */
  canInteract: boolean;
  createdAt: string;
  wasEdited: boolean;
  author: Author;
  isOwner: boolean;
  startInEditMode?: boolean;
  /** Paid sponsorship currently running (server-decided). Shown to everyone as a disclosure. */
  isSponsored?: boolean;
  /** e.g. "Sat, 30 Nov" — only needed for the owner's promote card. */
  sponsoredUntilLabel?: string | null;
  /** Payment keys configured — owner sees a working Promote button. */
  paymentsEnabled?: boolean;
}

export default function PostDetailView({
  postId,
  initialContent,
  initialImage,
  initialImageWidth = null,
  initialImageHeight = null,
  initialCategory,
  commentCount,
  likeCount,
  likedByMe,
  canInteract,
  createdAt,
  wasEdited,
  author,
  isOwner,
  startInEditMode = false,
  isSponsored = false,
  sponsoredUntilLabel = null,
  paymentsEnabled = false,
}: PostDetailViewProps) {
  const [content, setContent] = useState(initialContent);
  const [image, setImage] = useState(initialImage);
  const [imageSize, setImageSize] = useState<{ w: number | null; h: number | null }>({
    w: initialImageWidth,
    h: initialImageHeight,
  });
  const [category, setCategory] = useState<PostCategory | null | undefined>(initialCategory);
  const [editing, setEditing] = useState(startInEditMode);
  // Live comment total — PostComments announces changes (new/deleted comments).
  const [liveCommentCount, setLiveCommentCount] = useState(commentCount);
  useEffect(() => {
    const onCount = (e: Event) => {
      const detail = (e as CustomEvent<{ postId: string; count: number }>).detail;
      if (detail?.postId === postId) setLiveCommentCount(detail.count);
    };
    window.addEventListener(COMMENT_COUNT_EVENT, onCount);
    return () => window.removeEventListener(COMMENT_COUNT_EVENT, onCount);
  }, [postId]);
  const [edited, setEdited] = useState(wasEdited);
  const authorName = author?.name ?? "Deleted User";

  if (editing) {
    return (
      <EditPostForm
        postId={postId}
        initialContent={content}
        initialImage={image}
        initialCategory={category ?? undefined}
        onCancel={() => setEditing(false)}
        onSaved={(post) => {
          setContent(post.content);
          setImage(post.image);
          setImageSize({ w: post.imageWidth ?? null, h: post.imageHeight ?? null });
          setCategory(post.category);
          setEdited(true);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <>
      {/* A post has no title — this gives the page a real H1 for SEO and
          screen readers without adding a visual heading. */}
      <h1 className="sr-only">{`Post by ${authorName} on DoonMeet`}</h1>

      <article
        className={`overflow-hidden rounded-[20px] border bg-surface ${isSponsored ? "border-accent/50" : "border-border"}`}
      >
        {isSponsored && (
          <p className="flex items-center gap-1.5 bg-accent-soft px-4 py-1.5 text-xs font-bold tracking-wide text-accent-fg uppercase">
            Sponsored
            <span className="font-semibold tracking-normal normal-case">· Paid promotion</span>
          </p>
        )}
        <header className="flex items-center gap-3 p-4">
          <UserLink userId={author?._id}>
            <Avatar name={authorName} src={author?.avatar} size={48} />
          </UserLink>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[17px] font-bold">
              <UserLink userId={author?._id}>{authorName}</UserLink>
            </p>
            <p className="text-sm text-muted">
              <time dateTime={createdAt}>{timeAgo(createdAt)}</time>
              {edited && " · edited"}
            </p>
          </div>
          {category && category !== "other" && (
            <Link
              href={categoryFeedPath(category)}
              className={`flex h-8 shrink-0 items-center rounded-full px-3 text-xs font-bold ${
                category === "business" ? "bg-accent-soft text-accent-fg" : "bg-primary-soft text-primary-fg"
              }`}
            >
              {getPostCategory(category).label}
            </Link>
          )}
        </header>

        <div className="px-4 pb-4">
          <p className="text-[17px] leading-relaxed wrap-anywhere whitespace-pre-line">{content}</p>
        </div>

        {/* Whole photo in its real shape; tap → full screen. */}
        {image && (
          <PostImage
            src={image}
            alt={`Photo shared by ${authorName}`}
            width={imageSize.w}
            height={imageSize.h}
            priority
          />
        )}

        {/* ❤️ · 💬 · Share — the same row as on the feed card. */}
        <footer className="flex items-center gap-2 px-3 py-2.5">
          <LikeButton
            postId={postId}
            initialLiked={likedByMe}
            initialCount={likeCount}
            canLike={canInteract}
            size="lg"
          />
          <a
            href="#comment-composer"
            onClick={(e) => {
              // Jump to the comment box and open the keyboard.
              const box = document.getElementById("comment-composer");
              if (box) {
                e.preventDefault();
                box.scrollIntoView({ block: "center", behavior: "smooth" });
                box.focus({ preventScroll: true });
              }
            }}
            className="flex h-12 shrink-0 items-center gap-1.5 rounded-[12px] bg-surface-2 px-4 text-[15px] font-semibold text-text transition-colors hover:bg-border"
          >
            <MessageCircle size={20} aria-hidden="true" />
            {liveCommentCount > 0 ? liveCommentCount : "Comment"}
          </a>
          <ShareButton
            variant="compact"
            title={`${authorName} on DoonMeet`}
            url={`https://doonmeet.in/posts/${postId}`}
            label="Share"
          />
        </footer>
      </article>

      {isOwner && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <button type="button" onClick={() => setEditing(true)} className={buttonClasses("secondary", "md")}>
            <Pencil size={17} aria-hidden="true" /> Edit post
          </button>
          <DeletePostButton postId={postId} redirectTo="/posts" />
        </div>
      )}

      {isOwner && paymentsEnabled && (
        <section
          aria-labelledby="promote-title"
          className="mt-4 rounded-[20px] border border-accent/40 bg-accent-soft/60 p-4"
        >
          <h2 id="promote-title" className="text-lg font-extrabold">
            {isSponsored ? "Your post is sponsored" : "Get more people to see this"}
          </h2>
          <p className="mt-0.5 mb-3 text-[15px] text-muted">
            Pin it at the top of the Doon Feed for {PROMOTION_PLAN_LABEL}, with a &quot;Sponsored&quot; label.{" "}
            <Link href="/promote" className="font-semibold text-primary-fg underline">
              How it works
            </Link>
          </p>
          <PromoteButton
            postId={postId}
            isSponsored={isSponsored}
            sponsoredUntilLabel={sponsoredUntilLabel}
            paymentsEnabled={paymentsEnabled}
          />
        </section>
      )}
    </>
  );
}
