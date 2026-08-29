import Link from "next/link";
import type { ReactNode } from "react";

interface UserLinkProps {
  userId: string;
  className?: string;
  children: ReactNode;
}

// Wraps a user's name/avatar so clicking it opens their public profile.
export default function UserLink({ userId, className, children }: UserLinkProps) {
  if (!userId) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link
      href={`/users/${userId}`}
      className={`transition-opacity hover:opacity-70 ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}
