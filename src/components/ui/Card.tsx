type CardElement = "div" | "article" | "section" | "li";

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: CardElement;
  /** "md" = p-4 (lists/feeds), "lg" = p-5 sm:p-6 (forms, detail panels), "none" = no padding. */
  padding?: "none" | "md" | "lg";
  children: React.ReactNode;
}

const PADDING = {
  none: "",
  md: "p-4",
  lg: "p-5 sm:p-6",
};

// Thin border, no heavy shadow — cheap to paint even in long lists.
export default function Card({
  as: Tag = "div",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <Tag
      className={`rounded-[20px] border border-border bg-surface ${PADDING[padding]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
