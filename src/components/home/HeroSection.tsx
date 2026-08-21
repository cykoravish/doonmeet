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

        {/* Valley at dusk illustration */}
        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background lg:max-w-none">
          <svg
            viewBox="0 0 400 280"
            className="h-auto w-full"
            role="img"
            aria-label="Illustration of the hills around Dehradun with Mussoorie's lights twinkling at dusk"
          >
            {/* Sky glow — warm dusk in dark theme, soft haze in light theme */}
            <defs>
              <radialGradient id="dusk-glow" cx="50%" cy="15%" r="70%">
                <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.18" />
                <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="400" height="280" fill="url(#dusk-glow)" />

            {/* Moon — night theme only */}
            <g className="hidden night:block">
              <circle cx="330" cy="45" r="16" className="fill-accent/25" />
              <circle cx="330" cy="45" r="9" className="fill-accent/70" />
            </g>

            {/* Sun haze — light theme only */}
            <circle cx="330" cy="45" r="22" className="hidden doon:block fill-accent/20" />

            {/* Farthest ridge — Mussoorie */}
            <path
              d="M0 95 L35 68 L70 88 L100 60 L135 84 L170 58 L205 82 L240 56 L275 80 L310 62 L345 86 L400 70 V0 H0 Z"
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
              d="M0 150 L50 110 L95 140 L150 100 L200 138 L255 105 L310 142 L400 115 V280 H0 Z"
              className="fill-primary/20"
            />

            {/* Nearest ridge */}
            <path
              d="M0 200 L60 165 L120 195 L190 155 L260 198 L330 168 L400 190 V280 H0 Z"
              className="fill-primary/35"
            />
          </svg>

          {/* Caption */}
          <div className="absolute bottom-4 left-4 rounded-full bg-background/70 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-sm">
            Mussoorie lights, seen from the valley
          </div>
        </div>
      </div>
    </section>
  );
}
