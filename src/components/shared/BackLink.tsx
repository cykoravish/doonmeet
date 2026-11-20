import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackLinkProps {
  href: string;
  label: string;
}

// 44px-tall back link used at the top of detail pages.
export default function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="-ml-2 mb-2 flex min-h-11 w-fit items-center gap-1.5 rounded-[12px] px-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-text"
    >
      <ArrowLeft size={17} aria-hidden="true" />
      {label}
    </Link>
  );
}
