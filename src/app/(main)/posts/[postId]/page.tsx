import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getPostById } from "@/lib/posts";
import { getSessionUser } from "@/lib/getSessionUser";
import PostComments from "@/components/posts/PostComments";
import PostDetailView from "@/components/posts/PostDetailView";

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
}

function buildPostDescription(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  return trimmed.length > 155 ? `${trimmed.slice(0, 152)}...` : trimmed;
}

export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPostById(postId);
  if (!post) return { title: "Post Not Found | DoonMeet" };

  const description = buildPostDescription(post.content as string);
  const authorName = (post.author as { name: string })?.name ?? "Someone";
  const title = `${authorName} on DoonMeet: ${description.slice(0, 60)}${description.length > 60 ? "..." : ""}`;

  return {
    title,
    description,
    alternates: { canonical: `https://doonmeet.in/posts/${postId}` },
    openGraph: {
      title,
      description,
      url: `https://doonmeet.in/posts/${postId}`,
      images: post.image ? [post.image as string] : [],
      type: "article",
    },
  };
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;
  const [post, currentUser] = await Promise.all([getPostById(postId), getSessionUser()]);

  if (!post) notFound();

  const author = post.author as { _id: string; name: string; avatar: string | null };
  const isOwner = !!currentUser && String(currentUser._id) === String(author._id);
  const createdAtStr = new Date(post.createdAt as unknown as string).toISOString();
  const updatedAtStr = new Date(post.updatedAt as unknown as string).toISOString();
  const wasEdited = updatedAtStr !== createdAtStr;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: buildPostDescription(post.content as string),
    articleBody: post.content,
    datePublished: createdAtStr,
    dateModified: updatedAtStr,
    image: post.image ? [post.image] : undefined,
    author: {
      "@type": "Person",
      name: author.name,
    },
    commentCount: post.commentCount,
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
          initialContent={post.content as string}
          initialImage={post.image as string | null}
          createdAt={createdAtStr}
          wasEdited={wasEdited}
          author={author}
          isOwner={isOwner}
        />

        <PostComments
          postId={postId}
          initialCommentCount={post.commentCount as number}
          isLoggedIn={!!currentUser}
        />
      </div>
    </div>
  );
}
