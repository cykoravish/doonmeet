import Link from "next/link";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">

      {/* Big 404 */}
      <div className="relative mb-8">
        <p
          className="text-[10rem] font-black leading-none opacity-5 select-none text-primary"
        >
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
         <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,rgb(var(--primary))_0%,rgb(var(--primary-light))_100%)]">
            <MapPin size={44} color="white" />
          </div>
        </div>
      </div>

      <h1 className="mb-2 text-3xl font-black">Lost in the Doon Valley?</h1>
      <p className="mb-8 max-w-sm text-sm text-muted">
        Looks like this page wandered off into the hills. Let&apos;s get you back.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 bg-primary"
        >
          Back to home
        </Link>
        <Link
          href="/events"
            className="rounded-xl border border-border px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-80"
        >
          Explore events
        </Link>
      </div>

      {/* Subtle Dehradun quote */}
      <p className="mt-16 text-xs text-muted">
        &ldquo;Not all those who wander in Dehradun are lost.&rdquo;
      </p>
    </div>
  );
}