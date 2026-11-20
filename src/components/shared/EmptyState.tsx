interface EmptyStateProps {
  /** A lucide icon element (preferred) or a legacy emoji string. */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = "🌿", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      {typeof icon === "string" ? (
        <div className="mb-4 text-5xl" aria-hidden="true">
          {icon}
        </div>
      ) : (
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary-soft text-primary-fg"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h2 className="mb-1.5 text-lg font-bold">{title}</h2>
      {description && <p className="mb-5 max-w-xs text-[15px] text-muted">{description}</p>}
      {action}
    </div>
  );
}
