import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

// Real Dehradun landmarks pinned around the hub — "you, on the Doon map"
const landmarks = [
  { x: 100, y: 68, cx: 128, cy: 58, r: 5, tone: "primary-light", label: "Clock Tower", pulseDelay: "0s" },
  { x: 300, y: 64, cx: 272, cy: 50, r: 5, tone: "accent", label: "FRI", pulseDelay: "0.5s" },
  { x: 336, y: 176, cx: 300, cy: 142, r: 6, tone: "primary", label: "Rajpur Road", pulseDelay: "1s" },
  { x: 296, y: 270, cx: 280, cy: 250, r: 5, tone: "accent", label: "Sahastradhara", pulseDelay: "1.5s" },
  { x: 86, y: 260, cx: 112, cy: 240, r: 5, tone: "primary-light", label: "Robber's Cave", pulseDelay: "0.8s" },
];

const hub = { x: 200, y: 165 };

const toneFill: Record<string, string> = {
  primary: "fill-primary",
  "primary-light": "fill-primary-light",
  accent: "fill-accent",
};

const routePath = (n: (typeof landmarks)[number]) =>
  `M${hub.x} ${hub.y} Q${n.cx} ${n.cy} ${n.x} ${n.y}`;

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-14 pt-10 md:px-12 md:pb-20 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-8">
        {/* Text column */}
        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5">
            <MapPin size={14} className="text-accent" />
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

        {/* "You, on the Doon map" — real landmarks pinned around the hub */}
        <div className="relative mx-auto flex w-full max-w-md items-center justify-center lg:max-w-none">
          {/* Soft ambient glow behind the map — single small blurred orb, cheap */}
          <div className="absolute h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute h-40 w-40 translate-x-16 -translate-y-10 rounded-full bg-accent/10 blur-3xl" />

          <svg
            viewBox="0 0 400 340"
            className="relative h-auto w-full"
            role="img"
            aria-label="Map illustration of Dehradun landmarks — Clock Tower, FRI, Rajpur Road, Sahastradhara and Robber's Cave — connected to you at the centre"
          >
            {/* Dashed loop road connecting neighbouring landmarks */}
            <polygon
              points={landmarks.map((n) => `${n.x},${n.y}`).join(" ")}
              fill="none"
              stroke="rgb(var(--border))"
              strokeWidth="1"
              strokeDasharray="3 5"
              opacity="0.6"
            />

            {/* Curved routes from hub to each landmark */}
            <g stroke="rgb(var(--primary-light))" strokeWidth="1.25" opacity="0.35" fill="none">
              {landmarks.map((n, i) => (
                <path key={i} d={routePath(n)} />
              ))}
            </g>

            {/* Traveling pulses along two routes — suggests people moving across the city */}
            <circle r="3" className="fill-accent">
              <animateMotion dur="3.6s" repeatCount="indefinite" path={routePath(landmarks[2])} />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.1;0.85;1"
                dur="3.6s"
                repeatCount="indefinite"
              />
            </circle>
            <circle r="3" className="fill-primary-light">
              <animateMotion
                dur="4.4s"
                begin="1.2s"
                repeatCount="indefinite"
                path={routePath(landmarks[4])}
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.1;0.85;1"
                dur="4.4s"
                begin="1.2s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Landmark pins */}
            {landmarks.map((n, i) => (
              <g key={i}>
                <circle cx={n.x} cy={n.y} r={n.r + 6} className={toneFill[n.tone]} opacity="0.12" />
                <circle cx={n.x} cy={n.y} r={n.r} className={toneFill[n.tone]}>
                  <animate
                    attributeName="opacity"
                    values="0.6;1;0.6"
                    dur="2.8s"
                    begin={n.pulseDelay}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            ))}

            {/* Central hub — "you" */}
            <circle cx={hub.x} cy={hub.y} r="26" className="fill-primary" opacity="0.15" />
            <circle cx={hub.x} cy={hub.y} r="16" className="fill-primary" opacity="0.25" />
            <circle cx={hub.x} cy={hub.y} r="9" className="fill-primary-light" />
          </svg>

          {/* Landmark name chips — hidden below sm to keep the mobile view clean */}
          {landmarks.map((n, i) => (
            <span
              key={i}
              className="pointer-events-none absolute hidden -translate-x-1/2 -translate-y-full rounded-full border border-border bg-surface/90 px-2 py-0.5 text-[11px] font-medium text-muted shadow-sm sm:block"
              style={{ left: `${(n.x / 400) * 100}%`, top: `${(n.y / 340) * 100 - 3}%` }}
            >
              {n.label}
            </span>
          ))}

          {/* "You" chip at the hub — kept on all breakpoints, it's short */}
          <span
            className="pointer-events-none absolute -translate-x-1/2 translate-y-4 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm"
            style={{ left: `${(hub.x / 400) * 100}%`, top: `${(hub.y / 340) * 100}%` }}
          >
            You
          </span>
        </div>
      </div>
    </section>
  );
}
