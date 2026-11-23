import { ChevronDown } from "lucide-react";
import type { CommunityGuide as Guide } from "@/data/communityGuides";
import JoinLeaveButton from "@/components/communities/JoinLeaveButton";

interface CommunityGuideProps {
  guide: Guide;
  slug: string;
  isMember: boolean;
  isLoggedIn: boolean;
}

// "**Name**" → <strong>Name</strong>. Plain text otherwise (no HTML is ever
// injected — React escapes every piece).
function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-text">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
}

const updatedFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

// Server-rendered local guide for a community page — readable for people,
// and real content for search engines even before members start posting.
export default function CommunityGuide({ guide, slug, isMember, isLoggedIn }: CommunityGuideProps) {
  return (
    <article className="rounded-[20px] border border-border bg-surface p-5 sm:p-6">
      <p className="text-[16px] leading-relaxed text-text">
        <RichText text={guide.intro} />
      </p>

      {guide.sections.map((section) => (
        <section key={section.heading} className="mt-6">
          <h2 className="text-xl font-extrabold sm:text-2xl">{section.heading}</h2>
          {section.paragraphs.map((paragraph, i) => (
            <p key={i} className="mt-2 text-[16px] leading-relaxed text-muted">
              <RichText text={paragraph} />
            </p>
          ))}
        </section>
      ))}

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-extrabold sm:text-2xl">Frequently asked questions</h2>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {guide.faqs.map((faq) => (
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

      <div className="mt-6 rounded-2xl bg-primary-soft p-4">
        <p className="text-[15px] leading-relaxed font-medium text-text">{guide.cta}</p>
        {!isMember && (
          <div className="mt-3 sm:max-w-xs">
            <JoinLeaveButton slug={slug} isMember={isMember} isLoggedIn={isLoggedIn} />
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-muted">
        Last updated:{" "}
        <time dateTime={guide.updatedAt}>{updatedFormat.format(new Date(`${guide.updatedAt}T00:00:00+05:30`))}</time>
      </p>
    </article>
  );
}
