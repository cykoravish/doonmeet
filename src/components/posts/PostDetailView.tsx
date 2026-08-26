"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil } from "lucide-react";
import UserLink from "@/components/shared/UserLink";
import { Avatar, timeAgo } from "./PostCard";
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
      {/* Visually hidden — gives the page a real H1 for SEO/accessibility
          without changing the card's visual layout, which has no title slot. */}
      <h1 className="sr-only">{`Post by ${author.name} on DoonMeet`}</h1>

      <article
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}
      >
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <UserLink userId={author._id}>
            <Avatar name={author.name} avatar={author.avatar} size={44} />
          </UserLink>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              <UserLink userId={author._id}>{author.name}</UserLink>
            </p>
            <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
              {timeAgo(createdAt)}
              {edited && " · edited"}
            </p>
          </div>
        </div>

        <div className="px-4 pb-5 sm:px-5">
          <p className="whitespace-pre-line break-words text-sm leading-relaxed">{content}</p>
        </div>

        {image && (
          <div className="relative h-64 w-full sm:h-96">
            <Image src={image} alt={`Post by ${author.name}`} fill priority className="object-cover" />
          </div>
        )}
      </article>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ShareButton
          title={`${author.name} on DoonMeet`}
          url={`https://doonmeet.in/posts/${postId}`}
          label="Share Post"
        />
        {isOwner && (
          <>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors active:opacity-70"
              style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
            >
              <Pencil size={13} /> Edit
            </button>
            <DeletePostButton postId={postId} redirectTo="/posts" />
          </>
        )}
      </div>
    </>
  );
}
