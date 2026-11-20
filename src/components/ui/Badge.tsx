export type BadgeTone = "neutral" | "primary" | "solid" | "accent" | "danger";

interface BadgeProps {
  tone?: BadgeTone;
  /** "sm" for inline labels (Sponsored, New), "md" for filter chips. */
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-text",
  primary: "bg-primary-soft text-primary-fg",
  solid: "bg-primary text-on-primary",
  accent: "bg-accent-soft text-accent-fg",
  danger: "bg-danger/10 text-danger",
};

const SIZES = {
  sm: "h-6 px-2.5 text-xs",
  md: "h-9 px-3.5 text-sm",
};

/**
 * Pill label. For a tappable filter chip, wrap the same classes in a
 * <button>/<Link> via badgeClasses() so the 36px+ tap target is kept.
 */
export function badgeClasses(tone: BadgeTone = "neutral", size: "sm" | "md" = "sm"): string {
  return `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${TONES[tone]} ${SIZES[size]}`;
}

export default function Badge({ tone = "neutral", size = "sm", children, className = "" }: BadgeProps) {
  return <span className={`${badgeClasses(tone, size)} ${className}`}>{children}</span>;
}
