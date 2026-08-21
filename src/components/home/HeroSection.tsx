import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

const mussoorieLights = [
  { cx: 60, cy: 78, r: 1.6, delay: "0s" },
  { cx: 95, cy: 70, r: 1.2, delay: "0.4s" },
  { cx: 130, cy: 74, r: 1.8, delay: "0.9s" },
  { cx: 165, cy: 66, r: 1.3, delay: "0.2s" },
  { cx: 200, cy: 72, r: 1.6, delay: "1.3s" },
  { cx: 235, cy: 64, r: 1.2, delay: "0.6s" },
  { cx: 270, cy: 70, r: 1.7, delay: "1.6s" },
  { cx: 305, cy: 76, r: 1.3, delay: "0.1s" },
  { cx: 340, cy: 68, r: 1.6, delay: "1.0s" },
  { cx: 110, cy: 82, r: 1.1, delay: "1.8s" },
  { cx: 250, cy: 80, r: 1.1, delay: "0.7s" },
  { cx: 180, cy: 84, r: 1.4, delay: "1.4s" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-14 pt-10 md:px-12 md:pb-20 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-8">
        {/* Text column */}
        <div className="relative z-10">
          <div className="mb-5 flex items-center gap-2">
            <MapPin size={14} className="text-primary" />
            <span className="text-sm font-medium text-primary">Dehradun, Uttarakhand</span>
          </div>

          <h1 className="mb-5 text-[2.75rem] font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-6xl xl:text-7xl">
            Your city.
            <br />
            <span className="text-primary">Your people.</span>
          </h1>

          <p className="mb-7 max-w-md text-base leading-relaxed text-muted">
            Chat, meet, and explore Dehradun — one connection at a time. From Rajpur Road to
            Robber&apos;s Cave, your people are already here.
          </p>

          <div className="mb-8 flex flex-wrap gap-3">
            <Link
              href="/chat"
              className="flex min-h-[48px] items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Join the public chat
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/events"
              className="flex min-h-[48px] items-center gap-2 rounded-xl border border-border bg-surface px-6 text-sm font-semibold text-text transition-colors hover:bg-background"
            >
              <CalendarDays size={15} className="text-accent" />
              Explore Events
            </Link>
          </div>

          {/* Trust line */}
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-light opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-light" />
            </span>
            Dehradun&apos;s own, growing community
          </div>
        </div>

        {/* Valley at dusk illustration — free-flowing, no frame */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <svg
            viewBox="0 0 400 280"
            className="h-auto w-full"
            role="img"
            aria-label="Illustration of the hills around Dehradun with Mussoorie's lights twinkling at dusk"
          >
            {/* Farthest ridge — Mussoorie, soft rolling curves */}
            <path
              d="M0 110 C 40 78, 70 100, 100 82 C 130 64, 160 96, 190 78 C 220 60, 250 92, 280 74 C 310 58, 350 88, 400 70 V 0 H 0 Z"
              className="fill-primary/12"
            />

            {/* Twinkling hillside lights — night theme only */}
            <g className="hidden night:block">
              {mussoorieLights.map((l, i) => (
                <circle key={i} cx={l.cx} cy={l.cy} r={l.r} className="fill-accent">
                  <animate
                    attributeName="opacity"
                    values="0.15;1;0.15"
                    dur="3.2s"
                    begin={l.delay}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>

            {/* Middle ridge */}
            <path
              d="M0 165 C 45 130, 85 158, 130 128 C 175 98, 215 150, 260 122 C 300 98, 340 140, 400 118 V 280 H 0 Z"
              className="fill-primary/20"
            />

            {/* Nearest ridge */}
            <path
              d="M0 215 C 50 178, 100 208, 155 176 C 205 148, 255 200, 310 172 C 345 154, 375 188, 400 178 V 280 H 0 Z"
              className="fill-primary/35"
            />
          </svg>

          {/* Caption */}
          <div className="absolute bottom-3 left-3 rounded-full bg-background/70 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-sm">
            Mussoorie lights, seen from the valley
          </div>
        </div>
      </div>
    </section>
  );
}
