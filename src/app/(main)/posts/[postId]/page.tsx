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

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ edit?: string }>;
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
  const { edit } = await searchParams;
  const [post, currentUser] = await Promise.all([getPostById(postId), getSessionUser()]);

  if (!post) notFound();

  const author = post.author;
  const isOwner = !!currentUser && String(currentUser._id) === String(author._id);
  const startInEditMode = isOwner && edit === "1";
  const createdAtStr = new Date(post.createdAt).toISOString();
  const updatedAtStr = new Date(post.updatedAt).toISOString();
  const wasEdited = updatedAtStr !== createdAtStr;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: buildPostDescription(post.content),
    articleBody: post.content,
    datePublished: createdAtStr,
    dateModified: updatedAtStr,
    image: post.image ? [absoluteUrl(post.image)] : undefined,
    url: absoluteUrl(`/posts/${postId}`),
    author: {
      "@type": "Person",
      name: author.name,
    },
    commentCount: post.commentCount,
  };

  return (
    <div className="min-h-screen">
      <JsonLd data={[jsonLd, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Posts", path: "/posts" }, { name: buildPostDescription(post.content).slice(0, 60), path: `/posts/${postId}` }])]} />

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/posts"
          className="mb-5 flex w-fit items-center gap-1.5 text-xs font-medium"
          style={{ color: "rgb(var(--muted))" }}
        >
          <ArrowLeft size={13} /> All Posts
        </Link>

        <PostDetailView
          postId={postId}
          initialContent={post.content}
          initialImage={post.image}
          createdAt={createdAtStr}
          wasEdited={wasEdited}
          author={author}
          isOwner={isOwner}
          startInEditMode={startInEditMode}
        />

        <PostComments
          postId={postId}
          initialCommentCount={post.commentCount}
          isLoggedIn={!!currentUser}
        />
      </div>
    </div>
  );
}
