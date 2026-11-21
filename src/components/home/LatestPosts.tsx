import Link from "next/link";
import { MessageCircle, PenLine } from "lucide-react";
import type { PostListItem } from "@/lib/posts";
import { timeAgo } from "@/lib/notificationTypeConfig";
import Avatar from "@/components/ui/Avatar";
import { buttonClasses } from "@/components/ui/Button";
import SectionHeader from "./SectionHeader";

interface LatestPostsProps {
  posts: PostListItem[];
  isLoggedIn: boolean;
}

// Server-rendered post previews — real, fresh text on the home page is
// also good for SEO (crawlers see what the community is talking about).
export default function LatestPosts({ posts, isLoggedIn }: LatestPostsProps) {
  return (
    <section aria-labelledby="home-latest-posts">
      <SectionHeader id="home-latest-posts" title="Latest in Doon" href="/posts" linkLabel="See feed" />

      {posts.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-border p-5 text-center">
          <p className="font-semibold">Feed abhi khaali hai</p>
          <p className="mt-1 text-sm text-muted">Be the first to share something with Dehradun.</p>
          <Link
            href={isLoggedIn ? "/posts?compose=1" : "/signup"}
            className={buttonClasses("primary", "md", "mt-4")}
          >
            <PenLine size={18} aria-hidden="true" />
            Write the first post
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {posts.map((post) => (
            <li key={post._id}>
              <Link
                href={`/posts/${post._id}`}
                className="flex gap-3 rounded-[20px] border border-border bg-surface p-3.5 transition-colors hover:bg-surface-2"
              >
                <Avatar name={post.author?.name ?? "Deleted User"} src={post.author?.avatar} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-muted">
                    <span className="font-bold text-text">{post.author?.name ?? "Deleted User"}</span>
                    {" · "}
                    <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[15px] leading-snug wrap-anywhere text-text">
                    {post.content}
                  </p>
                  {post.commentCount > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-[13px] text-muted">
                      <MessageCircle size={14} aria-hidden="true" />
                      {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
