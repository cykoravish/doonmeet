interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — icon-only buttons need a spoken name for screen readers. */
  label: string;
  variant?: "soft" | "ghost" | "primary";
  children: React.ReactNode;
}

const VARIANTS = {
  soft: "bg-surface-2 text-text hover:bg-border",
  ghost: "text-muted hover:bg-surface-2 hover:text-text",
  primary: "bg-primary text-on-primary hover:bg-primary/90",
};

// 44×44 minimum tap target (WCAG / Apple HIG).
export default function IconButton({
  label,
  variant = "soft",
  className = "",
  type = "button",
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`btn-springy inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
