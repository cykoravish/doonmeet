import Link from "next/link";
import { CircleCheck, Megaphone, PenLine } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { getSessionUser } from "@/lib/getSessionUser";
import { isPaymentsConfigured } from "@/lib/razorpay";
import { getPostCategory, type PostCategory } from "@/lib/postCategories";
import { eventShortDate } from "@/lib/dates";
import { PROMOTION_DAYS, PROMOTION_PRICE_LABEL } from "@/lib/promotionPlans";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import BackLink from "@/components/shared/BackLink";
import PromoteButton from "@/components/promotions/PromoteButton";
import { buttonClasses } from "@/components/ui/Button";

export const metadata = pageMetadata({
  title: "Promote Your Business in Dehradun — Sponsored Posts",
  description: `Reach people across Dehradun: pin your post at the top of the DoonMeet feed for ${PROMOTION_PRICE_LABEL} for ${PROMOTION_DAYS} days. Pay once with UPI, card or netbanking.`,
  path: "/promote",
  keywords: ["advertise in Dehradun", "promote business Dehradun", "local advertising Dehradun"],
});

interface MyPost {
  _id: string;
  content: string;
  category?: PostCategory | null;
  sponsoredUntil?: string | null;
  createdAt: string;
}

const BENEFITS = [
  "Pinned at the top of the Doon Feed — and of your post's category — for a full week",
  'A clear "Sponsored" label, so people know it\'s a local business they can trust',
  "Pay once with UPI, card or netbanking (secured by Razorpay) — no subscription",
  "Goes live the moment your payment is confirmed",
];

export default async function PromotePage() {
  const user = await getSessionUser();
  const paymentsEnabled = isPaymentsConfigured();

  let myPosts: MyPost[] = [];
  if (user) {
    await connectDB();
    const docs = await Post.find({ author: user._id })
      .sort({ _id: -1 })
      .limit(10)
      .select("content category sponsoredUntil createdAt")
      .lean();
    myPosts = JSON.parse(JSON.stringify(docs));
  }
  const now = new Date().getTime();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-3 pb-10 sm:px-6 sm:pt-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Promote", path: "/promote" },
        ])}
      />
      <BackLink href="/posts" label="Doon Feed" />

      <header className="mb-5">
        <p className="mb-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-sm font-semibold text-accent-fg">
          <Megaphone size={15} aria-hidden="true" />
          For local businesses
        </p>
        <h1 className="text-[28px] leading-tight font-extrabold sm:text-4xl">Promote your business</h1>
        <p className="mt-1 text-[15px] text-muted sm:text-base">
          Get your shop, service or offer in front of people across Dehradun.
        </p>
      </header>

      {/* Pricing */}
      <section aria-labelledby="pricing-title" className="rounded-[24px] border border-accent/40 bg-surface p-5">
        <h2 id="pricing-title" className="sr-only">
          Pricing
        </h2>
        <p className="flex items-baseline gap-2">
          <span className="font-display text-5xl font-extrabold">{PROMOTION_PRICE_LABEL}</span>
          <span className="text-lg font-semibold text-muted">for {PROMOTION_DAYS} days</span>
        </p>
        <ul className="mt-4 flex flex-col gap-2.5">
          {BENEFITS.map((b) => (
            <li key={b} className="flex gap-2.5 text-[15px] text-text">
              <CircleCheck size={19} className="mt-0.5 shrink-0 text-primary-fg" aria-hidden="true" />
              {b}
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-title" className="mt-6">
        <h2 id="how-title" className="mb-3 text-xl font-extrabold">
          How it works
        </h2>
        <ol className="flex flex-col gap-2">
          {[
            <>
              Write a post — choose the <strong>Local Business</strong> category, add a photo and your offer.
            </>,
            <>Pick it below and tap Promote.</>,
            <>
              Pay {PROMOTION_PRICE_LABEL}. It&apos;s pinned with a &quot;Sponsored&quot; label for {PROMOTION_DAYS} days.
            </>,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 rounded-[16px] bg-surface-2 p-3.5 text-[15px]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Choose a post */}
      <section aria-labelledby="choose-title" className="mt-6">
        <h2 id="choose-title" className="mb-3 text-xl font-extrabold">
          {user ? "Choose a post to promote" : "Get started"}
        </h2>

        {!user ? (
          <div className="rounded-[20px] bg-primary-soft p-4">
            <p className="font-semibold">Log in to promote a post</p>
            <p className="mt-0.5 text-[15px] text-muted">A free account takes less than a minute.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
              <Link href="/login" className={buttonClasses("outline", "md")}>
                Log in
              </Link>
              <Link href="/signup" className={buttonClasses("primary", "md")}>
                Sign up free
              </Link>
            </div>
          </div>
        ) : myPosts.length === 0 ? (
          <div className="flex flex-col items-center rounded-[20px] border border-dashed border-border py-10 text-center">
            <PenLine size={26} className="mb-2 text-muted" aria-hidden="true" />
            <p className="font-semibold">You haven&apos;t posted yet</p>
            <p className="mt-0.5 mb-4 max-w-xs text-[15px] text-muted">
              Write a Local Business post first, then come back here to promote it.
            </p>
            <Link href="/posts?compose=1" className={buttonClasses("primary", "md")}>
              Write a post
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {myPosts.map((p) => {
              const until = p.sponsoredUntil ? new Date(p.sponsoredUntil) : null;
              const active = !!until && until.getTime() > now;
              const categoryLabel = p.category && p.category !== "other" ? getPostCategory(p.category).label : null;
              return (
                <li key={p._id} className="rounded-[20px] border border-border bg-surface p-4">
                  <Link href={`/posts/${p._id}`} className="block">
                    <p className="mb-1 text-[13px] text-muted">
                      {categoryLabel && <span className="font-semibold text-primary-fg">{categoryLabel} · </span>}
                      {eventShortDate(p.createdAt)}
                    </p>
                    <p className="line-clamp-2 text-[15px] break-words text-text">{p.content}</p>
                  </Link>
                  <div className="mt-3">
                    <PromoteButton
                      postId={p._id}
                      isSponsored={active}
                      sponsoredUntilLabel={active && until ? eventShortDate(until) : null}
                      paymentsEnabled={paymentsEnabled}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-8 text-sm text-muted">
        Sponsored posts must follow our{" "}
        <Link href="/terms" className="font-semibold underline">
          Terms
        </Link>{" "}
        — posts that break them are removed without a refund. Payments are covered by our{" "}
        <Link href="/refund-policy" className="font-semibold underline">
          Refund Policy
        </Link>
        . Questions?{" "}
        <Link href="/grievance" className="font-semibold underline">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}
