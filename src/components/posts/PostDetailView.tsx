"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil } from "lucide-react";
import UserLink from "@/components/shared/UserLink";
import Avatar from "@/components/ui/Avatar";
import { buttonClasses } from "@/components/ui/Button";
import { timeAgo } from "./PostCard";
import EditPostForm from "./EditPostForm";
import ShareButton from "@/components/events/ShareButton";
import DeletePostButton from "./DeletePostButton";

interface Author {
  _id: string;
  name: string;
  avatar: string | null;
}

interface PostDetailViewProps {
  postId: string;
  initialContent: string;
  initialImage: string | null;
  createdAt: string;
  wasEdited: boolean;
  author: Author;
  isOwner: boolean;
  startInEditMode?: boolean;
}

export default function PostDetailView({
  postId,
  initialContent,
  initialImage,
  createdAt,
  wasEdited,
  author,
  isOwner,
  startInEditMode = false,
}: PostDetailViewProps) {
  const [content, setContent] = useState(initialContent);
  const [image, setImage] = useState(initialImage);
  const [editing, setEditing] = useState(startInEditMode);
  const [edited, setEdited] = useState(wasEdited);
  const authorName = author?.name ?? "Deleted User";

  if (editing) {
    return (
      <EditPostForm
        postId={postId}
        initialContent={content}
        initialImage={image}
        onCancel={() => setEditing(false)}
        onSaved={(post) => {
          setContent(post.content);
          setImage(post.image);
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

      <article className="overflow-hidden rounded-[20px] border border-border bg-surface">
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
        </header>

        <div className="px-4 pb-4">
          <p className="text-[17px] leading-relaxed break-words whitespace-pre-line">{content}</p>
        </div>

        {image && (
          <div className="relative aspect-[4/3] w-full bg-surface-2">
            {/* object-contain: show the whole photo on the detail page, never crop it */}
            <Image
              src={image}
              alt={`Photo shared by ${authorName}`}
              fill
              priority
              sizes="(max-width: 672px) 100vw, 672px"
              className="object-contain"
            />
          </div>
        )}
      </article>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
        <ShareButton title={`${authorName} on DoonMeet`} url={`https://doonmeet.in/posts/${postId}`} label="Share post" />
        {isOwner && (
          <div className="grid grid-cols-2 gap-2 sm:contents">
            <button type="button" onClick={() => setEditing(true)} className={buttonClasses("secondary", "md")}>
              <Pencil size={17} aria-hidden="true" /> Edit
            </button>
            <DeletePostButton postId={postId} redirectTo="/posts" />
          </div>
        )}
      </div>
    </>
  );
}
