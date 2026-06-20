interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-10">
      <div>
        {eyebrow && (
          <p
            className="mb-2 text-sm font-semibold uppercase tracking-widest"
            style={{ color: "rgb(var(--primary))" }}
          >
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-black md:text-4xl">{title}</h1>
        {description && (
          <p
            className="mt-2 max-w-xl text-sm leading-relaxed"
            style={{ color: "rgb(var(--muted))" }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}