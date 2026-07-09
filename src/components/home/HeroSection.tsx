import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative h-[90vh] overflow-hidden">
      <Image
        src="/images/hero-clock-tower.webp"
        alt="Clock Tower Dehradun"
        fill
        priority
        className="object-cover object-center"
      />

      {/* Layered gradients — image visible at top, dark at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

      {/* Content — anchored to bottom left */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-16 md:px-12">
        <div className="mx-auto max-w-7xl">

          {/* Eyebrow */}
          <div className="mb-4 flex items-center gap-2">
            <MapPin size={14} style={{ color: "rgb(var(--primary-light))" }} />
            <span
              className="text-sm font-medium"
              style={{ color: "rgb(var(--primary-light))" }}
            >
              Dehradun, Uttarakhand
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-5xl font-black leading-[1.05] text-white md:text-6xl lg:text-7xl">
            Meet new
            <br />
            <span style={{ color: "rgb(var(--primary-light))" }}>Friends</span>
          </h1>

          <p className="mb-8 max-w-md text-base text-white/70">
            Connect with locals, discover events, explore communities and find your people across Dehradun.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/locations"
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "rgb(var(--primary))" }}
            >
              Explore the map
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/communities"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Join communities
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}