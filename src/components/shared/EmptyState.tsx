interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon = "🌿",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 text-5xl">{icon}</div>
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      {description && (
        <p
          className="mb-6 max-w-xs text-sm"
          style={{ color: "rgb(var(--muted))" }}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  );
}