import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import HeroMap from "./HeroMap";

interface HeroSectionProps {
  onlineCount: number;
}

// Guest hero — the page's only <h1> for visitors and search engines.
// Text-only on mobile (fast LCP, nothing to download); the static map
// appears from lg screens up.
export default function HeroSection({ onlineCount }: HeroSectionProps) {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 pt-7 pb-8 sm:px-6 md:pt-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:px-12 lg:pt-16 lg:pb-16">
      <div>
        <p className="mb-4 inline-flex h-8 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-sm font-semibold text-accent-fg">
          <MapPin size={15} aria-hidden="true" />
          Dehradun, Uttarakhand
        </p>

        <h1 className="text-[2.6rem] leading-[1.05] font-extrabold sm:text-6xl xl:text-7xl">
          Your city.
          <br />
          <span className="text-primary-fg">Your people.</span>
        </h1>

        <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted">
          DoonMeet is a free local community for Dehradun. Chat with people nearby, find events,
          join communities and discover places — from Rajpur Road to Robber&apos;s Cave.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Link href="/chat" className={buttonClasses("primary", "lg", "w-full sm:w-auto")}>
            Join the public chat
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link href="/signup" className={buttonClasses("secondary", "lg", "w-full sm:w-auto")}>
            Sign up free
          </Link>
        </div>

        <p className="mt-5 flex items-center gap-2 text-sm text-muted">
          <span className="h-2 w-2 rounded-full bg-online" aria-hidden="true" />
          {onlineCount > 1
            ? `${onlineCount} people from Dehradun are online right now`
            : "Dehradun's own, growing community"}
        </p>
      </div>

      <HeroMap />
    </section>
  );
}
