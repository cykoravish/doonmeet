import { GRIEVANCE_OFFICER } from "@/lib/legal";
import { buttonClasses } from "@/components/ui/Button";

export function LegalSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    // scroll-margin clears the sticky navbar — plus the TOC chip row below lg.
    <section id={id} className="scroll-mt-36 border-t border-border pt-8 first:border-t-0 first:pt-0 lg:scroll-mt-24">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="font-mono text-sm font-semibold text-accent-fg">{number}</span>
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
      </div>
      <div className="legal-prose space-y-4 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

const CALLOUT_TONES = {
  primary: { box: "border-primary/25 bg-primary-soft", title: "text-primary-fg" },
  accent: { box: "border-accent/30 bg-accent-soft", title: "text-accent-fg" },
  danger: { box: "border-danger/25 bg-danger/5", title: "text-danger" },
} as const;

export function LegalCallout({
  tone = "primary",
  title,
  children,
}: {
  tone?: keyof typeof CALLOUT_TONES;
  title: string;
  children: React.ReactNode;
}) {
  const colors = CALLOUT_TONES[tone];

  return (
    <div className={`rounded-2xl border p-4 md:p-5 ${colors.box}`}>
      <p className={`mb-1.5 font-bold ${colors.title}`}>{title}</p>
      <div className="space-y-2 text-[15px] leading-relaxed text-text">{children}</div>
    </div>
  );
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LegalContact() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
      <p className="mb-1 font-bold text-text">Questions about this policy?</p>
      <p className="mb-4 text-[15px] text-muted">
        Reach out and we&apos;ll get back to you — usually within a few days.
      </p>
      <a href={`mailto:${GRIEVANCE_OFFICER.email}`} className={buttonClasses("primary", "md")}>
        {GRIEVANCE_OFFICER.email}
      </a>
    </div>
  );
}
