import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getPostById } from "@/lib/posts";
import { getSessionUser } from "@/lib/getSessionUser";
import { Avatar, timeAgo } from "@/components/posts/PostCard";
import PostComments from "@/components/posts/PostComments";
import ShareButton from "@/components/events/ShareButton";
import DeletePostButton from "@/components/posts/DeletePostButton";
import UserLink from "@/components/shared/UserLink";

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
  const isOwner = currentUser && String(currentUser._id) === String(author._id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: buildPostDescription(post.content as string),
    articleBody: post.content,
    datePublished: new Date(post.createdAt as unknown as string).toISOString(),
    dateModified: new Date(post.updatedAt as unknown as string).toISOString(),
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

      <div className="mx-auto max-w-2xl px-6 py-8">
        <Link
          href="/posts"
          className="mb-6 flex w-fit items-center gap-1.5 text-xs font-medium"
          style={{ color: "rgb(var(--muted))" }}
        >
          <ArrowLeft size={13} /> All Posts
        </Link>

        <article
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}
        >
          <div className="flex items-start gap-3 p-5">
            <UserLink userId={author._id}>
              <Avatar name={author.name} avatar={author.avatar} size={44} />
            </UserLink>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                <UserLink userId={author._id}>{author.name}</UserLink>
              </p>
              <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                {timeAgo(post.createdAt as unknown as string)}
              </p>
            </div>
          </div>

          <div className="px-5 pb-5">
            <p className="whitespace-pre-line break-words text-sm leading-relaxed">
              {post.content as string}
            </p>
          </div>

          {post.image && (
            <div className="relative h-72 w-full sm:h-96">
              <Image
                src={post.image as string}
                alt={`Post by ${author.name}`}
                fill
                priority
                className="object-cover"
              />
            </div>
          )}
        </article>

        <div className="mt-4 flex items-center gap-2">
          <ShareButton
            title={`${author.name} on DoonMeet`}
            url={`https://doonmeet.in/posts/${postId}`}
            label="Share Post"
          />
          {isOwner && <DeletePostButton postId={postId} />}
        </div>

        <PostComments
          postId={postId}
          initialCommentCount={post.commentCount as number}
          isLoggedIn={!!currentUser}
        />
      </div>
    </div>
  );
}
