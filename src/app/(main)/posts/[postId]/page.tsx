import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  MIN_INDEXABLE_POST_LENGTH,
  pageMetadata,
  truncate,
} from "@/lib/seo";
import { getPostById } from "@/lib/posts";
import { getSessionUser } from "@/lib/getSessionUser";
import PostComments from "@/components/posts/PostComments";
import PostDetailView from "@/components/posts/PostDetailView";
import { isPaymentsConfigured } from "@/lib/razorpay";
import { eventShortDate } from "@/lib/dates";
import { connectDB } from "@/lib/db";
import { getTopLevelComments } from "@/lib/postComments";

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ edit?: string; comment?: string }>;
}

function buildPostDescription(content: string): string {
  return truncate(content, 155);
}

export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPostById(postId);
  if (!post) return { title: "Post Not Found", robots: { index: false, follow: false } };

  const description = buildPostDescription(post.content);
  const authorName = post.author?.name ?? "Someone";
  const title = `${authorName}: ${truncate(post.content, 55)}`;

  // Very short text-only posts ("hi", "test") are thin content — keep them
  // out of search results. They stay reachable by link.
  const isThin = post.content.trim().length < MIN_INDEXABLE_POST_LENGTH && !post.image;

  return pageMetadata({
    title,
    description,
    path: `/posts/${postId}`,
    image: post.image ?? undefined,
    type: "article",
    noindex: isThin,
  });
}

export default async function PostDetailPage({ params, searchParams }: PostDetailPageProps) {
  const { postId } = await params;
  const { edit, comment: focusComment } = await searchParams;
  const currentUser = await getSessionUser();
  const viewerId = currentUser?._id ? String(currentUser._id) : null;
  const [post, firstComments] = await Promise.all([
    getPostById(postId, viewerId),
    // First page of comments rendered on the server — shows instantly and
    // is readable by search engines.
    /^[a-f\d]{24}$/i.test(postId)
      ? connectDB().then(() => getTopLevelComments(postId)).catch(() => ({ comments: [], nextCursor: null }))
      : Promise.resolve({ comments: [], nextCursor: null }),
  ]);

  if (!post) notFound();

  const author = post.author;
  const isOwner = !!currentUser && !!author && String(currentUser._id) === String(author._id);
  const startInEditMode = isOwner && edit === "1";
  const sponsoredUntil = post.sponsoredUntil ? new Date(post.sponsoredUntil) : null;
  const isSponsored = !!sponsoredUntil && sponsoredUntil.getTime() > new Date().getTime();
  const createdAtStr = new Date(post.createdAt).toISOString();
  // editedAt is set only by a real edit (likes/comments also move updatedAt).
  const wasEdited = !!post.editedAt;
  const modifiedAtStr = post.editedAt ? new Date(post.editedAt).toISOString() : createdAtStr;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: buildPostDescription(post.content),
    articleBody: post.content,
    datePublished: createdAtStr,
    dateModified: modifiedAtStr,
    image: post.image ? [absoluteUrl(post.image)] : undefined,
    url: absoluteUrl(`/posts/${postId}`),
    author: {
      "@type": "Person",
      name: author?.name ?? "DoonMeet member",
    },
    commentCount: post.commentCount,
  };

  return (
    <div className="min-h-screen">
      <JsonLd data={[jsonLd, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Posts", path: "/posts" }, { name: buildPostDescription(post.content).slice(0, 60), path: `/posts/${postId}` }])]} />

      <div className="mx-auto max-w-2xl px-4 pt-3 pb-6 sm:px-6 sm:pt-6">
        <Link
          href="/posts"
          className="-ml-2 mb-2 flex min-h-11 w-fit items-center gap-1.5 rounded-[12px] px-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-text"
        >
          <ArrowLeft size={17} aria-hidden="true" /> Doon Feed
        </Link>

        <PostDetailView
          postId={postId}
          initialContent={post.content}
          initialImage={post.image}
          initialImageWidth={post.imageWidth ?? null}
          initialImageHeight={post.imageHeight ?? null}
          initialCategory={post.category ?? null}
          commentCount={post.commentCount}
          likeCount={post.likeCount ?? 0}
          likedByMe={!!post.likedByMe}
          canInteract={!!currentUser}
          createdAt={createdAtStr}
          wasEdited={wasEdited}
          author={author}
          isOwner={isOwner}
          startInEditMode={startInEditMode}
          isSponsored={isSponsored}
          sponsoredUntilLabel={isSponsored && sponsoredUntil ? eventShortDate(sponsoredUntil) : null}
          paymentsEnabled={isOwner && isPaymentsConfigured()}
        />

        <PostComments
          postId={postId}
          postAuthorId={author?._id ? String(author._id) : null}
          initialComments={firstComments.comments}
          initialNextCursor={firstComments.nextCursor}
          initialCommentCount={post.commentCount}
          currentUser={
            currentUser
              ? { _id: String(currentUser._id), name: currentUser.name, avatar: currentUser.avatar ?? null }
              : null
          }
          focusCommentId={focusComment && /^[a-f\d]{24}$/i.test(focusComment) ? focusComment : null}
        />
      </div>
    </div>
  );
}
