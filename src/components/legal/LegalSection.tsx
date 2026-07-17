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
    <section id={id} className="scroll-mt-24 border-t pt-8 first:border-t-0 first:pt-0" style={{ borderColor: "rgb(var(--border))" }}>
      <div className="mb-4 flex items-baseline gap-3">
        <span
          className="font-[family-name:var(--font-geist-mono)] text-sm font-semibold"
          style={{ color: "rgb(var(--accent))" }}
        >
          {number}
        </span>
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
      </div>
      <div
        className="legal-prose space-y-4 text-sm leading-relaxed md:text-[15px]"
        style={{ color: "rgb(var(--muted))" }}
      >
        {children}
      </div>
    </section>
  );
}

export function LegalCallout({
  tone = "primary",
  title,
  children,
}: {
  tone?: "primary" | "accent" | "danger";
  title: string;
  children: React.ReactNode;
}) {
  const colors = {
    primary: { border: "rgb(var(--primary) / 0.25)", bg: "rgb(var(--primary) / 0.06)", text: "rgb(var(--primary))" },
    accent: { border: "rgb(var(--accent) / 0.3)", bg: "rgb(var(--accent) / 0.08)", text: "rgb(var(--accent))" },
    danger: { border: "rgb(220 38 38 / 0.25)", bg: "rgb(220 38 38 / 0.06)", text: "rgb(220 38 38)" },
  }[tone];

  return (
    <div
      className="rounded-2xl border p-4 md:p-5"
      style={{ borderColor: colors.border, backgroundColor: colors.bg }}
    >
      <p className="mb-1.5 text-sm font-bold" style={{ color: colors.text }}>
        {title}
      </p>
      <div className="space-y-2 text-sm leading-relaxed" style={{ color: "rgb(var(--text))" }}>
        {children}
      </div>
    </div>
  );
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            className="mt-2 h-1 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: "rgb(var(--primary))" }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LegalContact() {
  return (
    <div
      className="rounded-2xl border p-5 md:p-6"
      style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}
    >
      <p className="mb-1 text-sm font-bold" style={{ color: "rgb(var(--text))" }}>
        Questions about this policy?
      </p>
      <p className="mb-4 text-sm" style={{ color: "rgb(var(--muted))" }}>
        Reach out and we&apos;ll get back to you — usually within a few days.
      </p>
      <a
        href="mailto:cykoravish@gmail.com"
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "rgb(var(--primary))" }}
      >
        cykoravish@gmail.com
      </a>
    </div>
  );
}