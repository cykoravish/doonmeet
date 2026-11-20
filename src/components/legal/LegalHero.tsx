import Link from "next/link";
import LegalContours from "./LegalContours";

export type LegalDocKey = "privacy" | "terms" | "refund" | "grievance";

const DOCS: { key: LegalDocKey; label: string; shortLabel: string; href: string }[] = [
  { key: "privacy", label: "Privacy Policy", shortLabel: "Privacy", href: "/privacy" },
  { key: "terms", label: "Terms of Service", shortLabel: "Terms", href: "/terms" },
  { key: "refund", label: "Refund & Cancellation", shortLabel: "Refunds", href: "/refund-policy" },
  { key: "grievance", label: "Grievance Redressal", shortLabel: "Grievance", href: "/grievance" },
];

interface LegalHeroProps {
  active: LegalDocKey;
  title: string;
  description: string;
  lastUpdated: string;
}

export default function LegalHero({ active, title, description, lastUpdated }: LegalHeroProps) {
  return (
    <div className="relative overflow-hidden border-b border-border bg-surface">
      <LegalContours className="pointer-events-none absolute inset-x-0 top-0 h-full w-full" />

      <div className="relative mx-auto max-w-5xl px-4 pt-10 pb-8 sm:px-6 md:pt-20 md:pb-10">
        <p className="mb-3 font-mono text-xs font-semibold tracking-[0.25em] text-primary-fg uppercase">
          Legal · Doon Valley
        </p>

        <h1 className="max-w-2xl text-4xl leading-[1.05] font-black md:text-5xl">{title}</h1>

        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted md:text-base">{description}</p>

        <p className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-primary-soft px-3 text-[13px] font-medium text-primary-fg">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          Last updated {lastUpdated}
        </p>

        {/* Doc switcher */}
        <nav aria-label="Legal documents" className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5 md:mt-8 md:pt-6">
          {DOCS.map((doc) => {
            const isActive = doc.key === active;
            return (
              <Link
                key={doc.key}
                href={doc.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border text-muted hover:bg-surface-2 hover:text-text"
                }`}
              >
                <span className="sm:hidden">{doc.shortLabel}</span>
                <span className="hidden sm:inline">{doc.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
