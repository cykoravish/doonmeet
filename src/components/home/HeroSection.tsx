import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

const landmarks = [
  { name: "Clock Tower", slug: "clock-tower", x: 210, y: 190, big: true },
  { name: "Rajpur Road", slug: "rajpur-road", x: 320, y: 100 },
  { name: "FRI", slug: "fri", x: 90, y: 110 },
  { name: "Robber's Cave", slug: "robbers-cave", x: 330, y: 250 },
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

        {/* Map column */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <svg
            viewBox="0 0 420 340"
            className="h-auto w-full"
            role="img"
            aria-label="Stylised map of the Doon Valley showing hills on both sides, the Rispana river and popular local spots"
          >
            <defs>
              <linearGradient id="doon-road" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgb(var(--primary-light))" stopOpacity="0.9" />
                <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            {/* Himalayan foothills — north ridge */}
            <path
              d="M0 60 Q 45 20 90 55 T 180 45 T 270 60 T 360 40 T 420 55 V0 H0 Z"
              className="fill-primary/15"
            />
            <path
              d="M0 75 Q 50 45 105 70 T 210 62 T 310 78 T 420 65 V50 Q 340 35 260 55 T 90 50 T 0 60 Z"
              className="fill-primary/10"
            />

            {/* Shivalik range — south ridge */}
            <path
              d="M0 340 V300 Q 55 260 115 292 T 235 278 T 345 296 T 420 280 V340 Z"
              className="fill-primary/15"
            />
            <path
              d="M0 340 V315 Q 60 285 130 308 T 250 298 T 360 312 T 420 300 V340 Z"
              className="fill-primary/25"
            />

            {/* Rispana river winding through the valley */}
            <path
              d="M0 190 Q 60 175 110 200 T 220 195 T 330 210 T 420 195"
              fill="none"
              stroke="rgb(var(--primary-light))"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.35"
            />

            {/* Road network connecting landmarks */}
            <g fill="none" stroke="url(#doon-road)" strokeWidth="1.75" strokeLinecap="round">
              <path d="M50 240 Q 130 120 210 190 T 380 110" opacity="0.55" />
              <path d="M30 160 Q 150 210 210 190 T 400 230" opacity="0.4" />
              <path d="M210 190 L 90 130" opacity="0.5" />
              <path d="M210 190 L 330 250" opacity="0.5" />
              <path d="M210 190 L 320 120" opacity="0.5" />
            </g>

            {/* Landmark pulse points */}
            {landmarks.map((p) => (
              <g key={p.slug}>
                <circle cx={p.x} cy={p.y} r={p.big ? 14 : 9} className="fill-primary-light/20">
                  <animate
                    attributeName="r"
                    values={p.big ? "14;20;14" : "9;13;9"}
                    dur="2.6s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0.05;0.5"
                    dur="2.6s"
                    repeatCount="indefinite"
                  />
                </circle>
                <Link href={`/places/${p.slug}`} aria-label={p.name}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={p.big ? 6 : 4.5}
                    className="fill-primary-light stroke-surface"
                    strokeWidth="2"
                  />
                  <text
                    x={p.x}
                    y={p.y - (p.big ? 22 : 16)}
                    textAnchor="middle"
                    className="fill-text text-[11px] font-semibold"
                  >
                    {p.name}
                  </text>
                </Link>
              </g>
            ))}

            {/* Doon Valley watermark label */}
            <text
              x="210"
              y="325"
              textAnchor="middle"
              className="fill-muted text-[10px] font-semibold uppercase tracking-[0.2em]"
              opacity="0.5"
            >
              Doon Valley
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
