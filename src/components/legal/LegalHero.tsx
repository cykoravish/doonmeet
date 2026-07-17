import Link from "next/link";
import LegalContours from "./LegalContours";

export type LegalDocKey = "privacy" | "terms" | "refund";

const DOCS: { key: LegalDocKey; label: string; shortLabel: string; href: string }[] = [
  { key: "privacy", label: "Privacy Policy", shortLabel: "Privacy", href: "/privacy" },
  { key: "terms", label: "Terms of Service", shortLabel: "Terms", href: "/terms" },
  { key: "refund", label: "Refund & Cancellation", shortLabel: "Refunds", href: "/refund-policy" },
];

interface LegalHeroProps {
  active: LegalDocKey;
  title: string;
  description: string;
  lastUpdated: string;
}

export default function LegalHero({ active, title, description, lastUpdated }: LegalHeroProps) {
  return (
    <div
      className="relative overflow-hidden border-b"
      style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}
    >
      <LegalContours className="pointer-events-none absolute inset-x-0 top-0 h-full w-full" />

      <div className="relative mx-auto max-w-5xl px-6 pb-10 pt-14 md:pt-20">
        <p
          className="mb-3 font-[family-name:var(--font-geist-mono)] text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "rgb(var(--primary))" }}
        >
          Legal · Doon Valley
        </p>

        <h1 className="max-w-2xl text-4xl font-black leading-[1.05] md:text-5xl">{title}</h1>

        <p
          className="mt-4 max-w-xl text-sm leading-relaxed md:text-base"
          style={{ color: "rgb(var(--muted))" }}
        >
          {description}
        </p>

        <div
          className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          style={{
            backgroundColor: "rgb(var(--primary) / 0.08)",
            color: "rgb(var(--primary))",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "rgb(var(--primary))" }} />
          Last updated {lastUpdated}
        </div>

        {/* Doc switcher */}
        <div className="mt-8 flex flex-wrap gap-2 border-t pt-6" style={{ borderColor: "rgb(var(--border))" }}>
          {DOCS.map((doc) => {
            const isActive = doc.key === active;
            return (
              <Link
                key={doc.key}
                href={doc.href}
                className="rounded-full border px-4 py-1.5 text-xs font-semibold transition-all sm:text-sm"
                style={{
                  backgroundColor: isActive ? "rgb(var(--primary))" : "transparent",
                  borderColor: isActive ? "rgb(var(--primary))" : "rgb(var(--border))",
                  color: isActive ? "white" : "rgb(var(--muted))",
                }}
              >
                <span className="sm:hidden">{doc.shortLabel}</span>
                <span className="hidden sm:inline">{doc.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}