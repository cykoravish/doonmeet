import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

// Shared so links styled as buttons (<Link className={buttonClasses()}>) match exactly.
const BASE =
  "btn-springy inline-flex select-none items-center justify-center gap-2 rounded-[14px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary/90",
  secondary: "bg-surface-2 text-text hover:bg-border",
  outline: "border-[1.5px] border-primary text-primary-fg hover:bg-primary-soft",
  ghost: "text-muted hover:bg-surface-2 hover:text-text",
  danger: "bg-danger text-white hover:bg-danger/90",
};

// Every size keeps the tap target at 40px+ (md/lg are 48/56px).
const SIZES: Record<ButtonSize, string> = {
  sm: "h-10 px-3.5 text-sm",
  md: "h-12 px-5 text-[15px]",
  lg: "h-14 px-6 text-base",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = ""
): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "w-full",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
