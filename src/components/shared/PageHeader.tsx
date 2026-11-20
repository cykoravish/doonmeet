interface PageHeaderProps {
  title: string;
  description?: string;
  /** Usually a primary "Create" link — sits beside the title, stays visible on phones. */
  action?: React.ReactNode;
}

// Standard top-of-page header for list pages (Events, Communities, Places…).
// The page's single <h1>.
export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3 sm:mb-6">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-tight font-extrabold sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 max-w-xl text-[15px] text-muted sm:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </header>
  );
}
