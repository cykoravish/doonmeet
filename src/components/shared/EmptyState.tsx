import { Leaf } from "lucide-react";

interface EmptyStateProps {
  /** A lucide icon element, e.g. `<Newspaper size={28} />`. */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** What to do next (e.g. a "Write a post" button) — offer one whenever possible. */
  action?: React.ReactNode;
}

export default function EmptyState({ icon = <Leaf size={28} />, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary-soft text-primary-fg"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h2 className="mb-1.5 text-lg font-bold">{title}</h2>
      {description && <p className="mb-5 max-w-xs text-[15px] text-muted">{description}</p>}
      {action}
    </div>
  );
}
