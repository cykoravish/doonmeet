import Link from "next/link";
import { Coffee } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";

// Small, friendly nudge on the home page — shown only while support payments are on.
export default function SupportCard() {
  return (
    <section
      aria-labelledby="home-support"
      className="flex flex-col gap-4 rounded-[24px] bg-accent-soft p-5 sm:flex-row sm:items-center"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-surface text-accent-fg">
        <Coffee size={28} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="home-support" className="text-xl font-extrabold text-text">
          Like DoonMeet? Buy us a chai ☕
        </h2>
        <p className="mt-0.5 text-[15px] text-muted">
          DoonMeet is free and will stay free. A small tip helps pay for servers and new features — no account
          needed, and you can stay anonymous.
        </p>
      </div>
      <Link href="/support" className={buttonClasses("primary", "md", "shrink-0 sm:w-auto")}>
        Support DoonMeet
      </Link>
    </section>
  );
}
