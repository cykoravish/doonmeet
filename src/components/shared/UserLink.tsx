import Link from "next/link";
import type { ReactNode } from "react";

interface UserLinkProps {
  userId: string;
  isGuest?: boolean;
  className?: string;
  children: ReactNode;
}

// Wraps a user's name/avatar so clicking it opens their public profile.
// Guests have no public profile (see getPublicUser), so guest content is
// rendered as plain, non-interactive text instead of a dead link.
export default function UserLink({ userId, isGuest, className, children }: UserLinkProps) {
  if (isGuest || !userId) {
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
