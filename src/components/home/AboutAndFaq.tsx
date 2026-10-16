import Link from "next/link";
import { ChevronDown } from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";

// Plain-text answers so the visible copy and the FAQPage schema stay identical.
const FAQS = [
  {
    q: "What is DoonMeet?",
    a: "DoonMeet is a free local community for Dehradun. You can chat with people nearby, find events, join interest-based communities, read what others are posting and discover places across the Doon Valley, all in one app.",
  },
  {
    q: "Is DoonMeet free to use?",
    a: "Yes, DoonMeet is free today. We may add optional paid features later, and the details will be spelled out in our Terms and Refund Policy before anything changes.",
  },
  {
    q: "Do I need an account?",
    a: "You can browse events, communities, places and posts without signing up. To post, RSVP, join a community or send direct messages, you'll need a free account with email or Google.",
  },
  {
    q: "How do I find events in Dehradun?",
    a: "Open the Events page, filter by an interest like tech, nature, food, photography, sports or arts, and RSVP in a couple of taps. You can also create your own event for the city.",
  },
  {
    q: "Which places in Dehradun can I explore?",
    a: "From Robber's Cave and the Clock Tower to cafes and weekend nature spots. Every place page has a short guide, the best time to visit, how to reach it and reviews from people who've been.",
  },
];

export default function AboutAndFaq() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      <div className="mb-8 sm:mb-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
          About DoonMeet
        </p>
        <h2 className="text-2xl font-black sm:text-3xl md:text-4xl">
          A better way to meet people in Dehradun
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Whether you grew up in the Doon Valley or just moved here for college or work, it&apos;s
          surprisingly hard to find the people and plans that fit you. DoonMeet puts{" "}
          <Link href="/events" className="font-medium text-primary hover:underline">
            local events
          </Link>
          ,{" "}
          <Link href="/communities" className="font-medium text-primary hover:underline">
            communities
          </Link>
          ,{" "}
          <Link href="/places" className="font-medium text-primary hover:underline">
            places to visit
          </Link>{" "}
          and a friendly{" "}
          <Link href="/chat" className="font-medium text-primary hover:underline">
            public chat
          </Link>{" "}
          in one place, so you can go from &quot;anyone up for chai?&quot; to actually meeting
          someone.
        </p>
      </div>

      <h3 className="mb-3 text-lg font-bold sm:text-xl">Frequently asked questions</h3>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {FAQS.map((f) => (
          <details key={f.q} className="group">
            <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold marker:hidden sm:px-5 sm:text-base [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown
                size={18}
                className="shrink-0 text-muted transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed text-muted sm:px-5">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
