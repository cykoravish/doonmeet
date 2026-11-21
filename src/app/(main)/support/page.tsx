import Link from "next/link";
import { notFound } from "next/navigation";
import { Coffee, Heart, Server, Sprout } from "lucide-react";
import { getSessionUser } from "@/lib/getSessionUser";
import { isSupportEnabled, normalizeIndianMobile } from "@/lib/support";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import SupportForm from "@/components/support/SupportForm";
import { buttonClasses } from "@/components/ui/Button";

export const metadata = pageMetadata({
  title: "Support DoonMeet",
  description:
    "DoonMeet is free for everyone in Dehradun and will stay free. Buy us a chai or coffee to help cover servers and keep the community growing.",
  path: "/support",
});

const WHERE_IT_GOES = [
  { icon: Server, text: "Servers, domain and email that keep DoonMeet running" },
  { icon: Sprout, text: "New features for Dehradun — events, places, communities" },
  { icon: Heart, text: "Keeping DoonMeet free, with no annoying ads" },
];

export default async function SupportPage() {
  // Hidden until support payments are switched on (SUPPORT_ENABLED + Cashfree keys).
  if (!isSupportEnabled()) notFound();

  const user = await getSessionUser();
  const needsPhone = !normalizeIndianMobile(user?.phone ?? null);

  return (
    <div className="mx-auto max-w-xl px-4 pt-3 pb-10 sm:px-6 sm:pt-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Support", path: "/support" },
        ])}
      />

      <header className="mb-5">
        <p className="mb-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-sm font-semibold text-accent-fg">
          <Coffee size={15} aria-hidden="true" />
          Buy us a chai
        </p>
        <h1 className="text-[28px] leading-tight font-extrabold sm:text-4xl">Support DoonMeet</h1>
        <p className="mt-1 text-[15px] text-muted sm:text-base">
          DoonMeet is free for everyone in Dehradun — and it will stay free. If it&apos;s made your city a little
          friendlier, you can chip in to keep it going.
        </p>
      </header>

      <ul className="mb-6 flex flex-col gap-2">
        {WHERE_IT_GOES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 rounded-[16px] bg-surface-2 p-3.5 text-[15px]">
            <Icon size={19} className="mt-0.5 shrink-0 text-primary-fg" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>

      <section aria-labelledby="support-form-title" className="rounded-[24px] border border-border bg-surface p-5">
        <h2 id="support-form-title" className="mb-4 text-xl font-extrabold">
          {user ? "Your support" : "Log in to support"}
        </h2>
        {user ? (
          <SupportForm needsPhone={needsPhone} />
        ) : (
          <div>
            <p className="text-[15px] text-muted">
              Support is linked to your account so we can say thanks with a ☕ Supporter badge.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
              <Link href="/login" className={buttonClasses("outline", "md")}>
                Log in
              </Link>
              <Link href="/signup" className={buttonClasses("primary", "md")}>
                Sign up free
              </Link>
            </div>
          </div>
        )}
      </section>

      <p className="mt-6 text-sm text-muted">
        Support is a voluntary payment for DoonMeet&apos;s service — it isn&apos;t a donation and has no tax
        benefit. It&apos;s non-refundable, except when money was charged by mistake (see our{" "}
        <Link href="/refund-policy" className="font-semibold underline">
          Refund Policy
        </Link>
        ). Questions?{" "}
        <Link href="/grievance" className="font-semibold underline">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}
