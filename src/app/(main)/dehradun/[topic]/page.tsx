import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronDown, Check } from "lucide-react";
import type { Metadata } from "next";
import PostsFeed from "@/components/posts/PostsFeed";
import FilterChips from "@/components/shared/FilterChips";
import JsonLd from "@/components/seo/JsonLd";
import { getSessionUser } from "@/lib/getSessionUser";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { getActiveSponsoredPosts, type PostListItem } from "@/lib/posts";
import { withViewerLikes } from "@/lib/postLikes";
import { POST_CATEGORIES, categoryQuery, type PostCategory } from "@/lib/postCategories";
import { categoryFeedPath, getCategoryLanding } from "@/data/categoryLandings";

// Fewer posts than the main feed: the local guide and FAQs sit below them,
// and the feed here uses a "Load more" button instead of infinite scroll.
const PAGE_SIZE = 10;

interface CategoryLandingPageProps {
  params: Promise<{ topic: string }>;
}

// Rendered per request (live posts, viewer's likes). Unknown topics → 404 below.
export async function generateMetadata({ params }: CategoryLandingPageProps): Promise<Metadata> {
  const { topic } = await params;
  const landing = getCategoryLanding(topic);
  if (!landing) return { title: "Not Found", robots: { index: false, follow: false } };
  return pageMetadata({
    title: landing.seoTitle,
    description: landing.seoDescription,
    path: `/dehradun/${landing.slug}`,
    keywords: landing.keywords,
  });
}

async function getCategoryFeed(category: PostCategory) {
  await connectDB();
  const posts = await Post.find(categoryQuery(category))
    .sort({ _id: -1 })
    .limit(PAGE_SIZE)
    .populate("author", "name avatar")
    .select("-imagePublicId -__v")
    .lean();
  const nextCursor = posts.length === PAGE_SIZE ? String(posts[posts.length - 1]._id) : null;
  return { posts: JSON.parse(JSON.stringify(posts)) as PostListItem[], nextCursor };
}

const updatedFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

export default async function CategoryLandingPage({ params }: CategoryLandingPageProps) {
  const { topic } = await params;
  const landing = getCategoryLanding(topic);
  if (!landing) notFound();

  const [{ posts: feedPosts, nextCursor }, currentUser, sponsoredRaw] = await Promise.all([
    getCategoryFeed(landing.category),
    getSessionUser(),
    getActiveSponsoredPosts({ category: landing.category }).catch(() => []),
  ]);

  const viewerId = currentUser?._id ? String(currentUser._id) : null;
  const [posts, sponsoredPosts] = await Promise.all([
    withViewerLikes(feedPosts, viewerId),
    withViewerLikes(sponsoredRaw, viewerId),
  ]);

  const path = `/dehradun/${landing.slug}`;

  return (
    <div className="min-h-screen">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Doon Feed", path: "/posts" },
            { name: landing.label, path },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: landing.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />

      <div className="mx-auto max-w-2xl px-4 pt-4 pb-6 sm:px-6 sm:pt-6">
        <header className="mb-3">
          <p className="text-xs font-bold tracking-wide text-primary-fg uppercase">Doon Feed · {landing.label}</p>
          <h1 className="mt-0.5 text-[28px] leading-tight font-extrabold sm:text-3xl">{landing.h1}</h1>
          <p className="mt-2 text-[16px] leading-relaxed text-muted">{landing.lead}</p>
        </header>

        <FilterChips
          label="Browse posts by category"
          items={[
            { label: "All", href: "/posts", active: false },
            ...POST_CATEGORIES.map((c) => ({
              label: c.label,
              href: categoryFeedPath(c.value),
              active: c.value === landing.category,
            })),
          ]}
        />

        <PostsFeed
          initialPosts={posts}
          initialNextCursor={nextCursor}
          isLoggedIn={!!currentUser}
          categoryFilter={landing.category}
          sponsoredPosts={sponsoredPosts}
          autoLoad={false}
          currentUser={
            currentUser
              ? { _id: String(currentUser._id), name: currentUser.name, avatar: currentUser.avatar }
              : null
          }
        />

        {/* Local guide + FAQs — real, server-rendered content for readers and search */}
        <article className="mt-6 rounded-[20px] border border-border bg-surface p-5 sm:p-6">
          {landing.guide.map((section, i) => (
            <section key={section.heading} className={i > 0 ? "mt-6" : ""}>
              <h2 className="text-xl font-extrabold sm:text-2xl">{section.heading}</h2>
              {section.paragraphs.map((p) => (
                <p key={p} className="mt-2 text-[16px] leading-relaxed text-muted">
                  {p}
                </p>
              ))}
              {section.tips && (
                <ul className="mt-3 flex flex-col gap-2">
                  {section.tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-text">
                      <Check size={18} className="mt-0.5 shrink-0 text-primary-fg" aria-hidden="true" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="mt-8">
            <h2 className="mb-3 text-xl font-extrabold sm:text-2xl">Frequently asked questions</h2>
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
              {landing.faqs.map((faq) => (
                <details key={faq.q} className="group">
                  <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[15px] font-semibold marker:hidden sm:text-base [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <ChevronDown
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    />
                  </summary>
                  <p className="px-4 pb-4 text-[15px] leading-relaxed text-muted">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          {landing.related.length > 0 && (
            <nav aria-label="Related pages" className="mt-6">
              <h2 className="mb-2 text-lg font-extrabold">You might also need</h2>
              <ul className="flex flex-col gap-1">
                {landing.related.map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      className="flex min-h-11 items-center justify-between gap-2 rounded-[14px] px-3 font-semibold text-primary-fg hover:bg-surface-2"
                    >
                      {r.label}
                      <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <p className="mt-4 text-sm text-muted">
            Last updated:{" "}
            <time dateTime={landing.updatedAt}>
              {updatedFormat.format(new Date(`${landing.updatedAt}T00:00:00+05:30`))}
            </time>
          </p>
        </article>
      </div>
    </div>
  );
}
