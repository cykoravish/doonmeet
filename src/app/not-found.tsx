import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] bg-primary-soft text-primary-fg">
        <MapPinOff size={38} aria-hidden="true" />
      </span>

      <p className="text-sm font-bold tracking-wider text-muted uppercase">Error 404</p>
      <h1 className="mt-1 text-[28px] leading-tight font-extrabold sm:text-4xl">Lost in the Doon Valley?</h1>
      <p className="mt-2 mb-7 max-w-sm text-[15px] text-muted">
        This page wandered off into the hills. Let&apos;s get you back.
      </p>

      <div className="flex w-full max-w-xs flex-col gap-2 sm:max-w-none sm:flex-row sm:justify-center">
        <Link href="/" className={buttonClasses("primary", "md")}>
          Back to home
        </Link>
        <Link href="/posts" className={buttonClasses("secondary", "md")}>
          See what&apos;s new
        </Link>
      </div>

      <p className="mt-14 text-sm text-muted">&ldquo;Not all those who wander in Dehradun are lost.&rdquo;</p>
    </main>
  );
}
