import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

// Every coordinate below is projected from the same real lat/lng data used by
// the live locations map (see DEHRADUN_OUTLINE and SPOTS in
// src/components/locations/DehradunMap.tsx) — this isn't a decorative shape,
// it's the actual Doon valley outline, just drawn small and static for the
// hero. Landmarks sit at their true position relative to each other.

// Real valley boundary (NW → SE), projected to the 400×380 viewBox
const VALLEY_OUTLINE =
  "177.7,55 243.2,79.5 292.3,120.5 325,169.5 341.4,218.6 308.6,267.7 243.2,308.6 161.4,325 95.9,308.6 55,267.7 63.2,202.3 104.1,136.8 145,87.7 177.7,55";

// City centre / Ghanta Ghar (Clock Tower) — the real heart of Dehradun,
// doubling as "you" on the map
const hub = { x: 197, y: 198 };

// Real landmarks — same true bearing/direction from Ghanta Ghar as on the
// actual map, but distance from the hub is exaggerated (~1.9x) so they read
// clearly at this small size. This is the same trick transit/metro maps use:
// stations keep their real relative direction, not their real scale.
const landmarks = [
  { x: 128, y: 173, cx: 150, cy: 195, r: 5, tone: "primary-light", label: "FRI", pulseDelay: "0s" },
  { x: 154, y: 113, cx: 160, cy: 160, r: 5, tone: "accent", label: "Robber's Cave", pulseDelay: "0.6s" },
  { x: 230, y: 176, cx: 225, cy: 185, r: 6, tone: "primary", label: "Rajpur Road", pulseDelay: "1.1s" },
  { x: 272, y: 111, cx: 250, cy: 150, r: 5, tone: "accent", label: "Sahastradhara", pulseDelay: "1.6s" },
];

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

        {/* The real Doon valley, drawn small — you at Ghanta Ghar, the city's heart */}
        <div className="relative mx-auto flex w-full max-w-md items-center justify-center lg:max-w-none">
          {/* Soft ambient glow behind the valley — single small blurred orb, cheap */}
          <div className="absolute h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute h-40 w-40 translate-x-16 -translate-y-10 rounded-full bg-accent/10 blur-3xl" />

          <svg
            viewBox="0 0 400 380"
            className="relative h-auto w-full"
            role="img"
            aria-label="Map of the real Doon valley outline with you at Ghanta Ghar, the city centre, connected to Rajpur Road, FRI, Robber's Cave and Sahastradhara"
          >
            {/* Himalayan foothills to the north, Shivalik range to the south —
                the valley DoonMeet is named for, drawn as simple ridgelines */}
            <path
              d="M0,48 L38,22 L72,36 L108,12 L146,32 Q178,8 210,30 L248,10 L284,34 L322,16 L362,36 L400,20 L400,0 L0,0 Z"
              className="fill-border"
              opacity="0.55"
            />
            <path
              d="M0,380 L44,352 L88,366 L136,344 Q176,362 216,342 L258,360 L302,338 L348,358 L400,342 L400,380 Z"
              className="fill-border"
              opacity="0.4"
            />

            {/* Valley floor — faint tint so the city footprint reads distinctly */}
            <polygon points={VALLEY_OUTLINE} className="fill-primary" opacity="0.06" />

            {/* Valley boundary — soft double glow + crisp dashed line, same
                visual language as the live locations map */}
            <polygon
              points={VALLEY_OUTLINE}
              fill="none"
              stroke="rgb(var(--primary-light))"
              strokeWidth="10"
              opacity="0.15"
            />
            <polygon
              points={VALLEY_OUTLINE}
              fill="none"
              stroke="rgb(var(--primary))"
              strokeWidth="1.5"
              strokeDasharray="2 3"
              opacity="0.8"
            />

            {/* Routes from Ghanta Ghar to each landmark */}
            <g stroke="rgb(var(--primary-light))" strokeWidth="1.25" opacity="0.4" fill="none">
              {landmarks.map((n, i) => (
                <path key={i} d={routePath(n)} />
              ))}
            </g>

            {/* Traveling pulses — suggests people moving across the city */}
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
                path={routePath(landmarks[3])}
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

            {/* Ghanta Ghar — the real city centre, and "you" */}
            <circle cx={hub.x} cy={hub.y} r="26" className="fill-primary" opacity="0.15" />
            <circle cx={hub.x} cy={hub.y} r="16" className="fill-primary" opacity="0.25" />
            <circle cx={hub.x} cy={hub.y} r="9" className="fill-primary-light" />
          </svg>

          {/* Landmark name chips — hidden below sm to keep the mobile view clean */}
          {landmarks.map((n, i) => (
            <span
              key={i}
              className="pointer-events-none absolute hidden -translate-x-1/2 -translate-y-full rounded-full border border-border bg-surface/90 px-2 py-0.5 text-[11px] font-medium text-muted shadow-sm sm:block"
              style={{ left: `${(n.x / 400) * 100}%`, top: `${(n.y / 380) * 100 - 3}%` }}
            >
              {n.label}
            </span>
          ))}

          {/* "You" chip at Ghanta Ghar — kept on all breakpoints */}
          <div
            className="pointer-events-none absolute flex -translate-x-1/2 translate-y-4 flex-col items-center gap-0.5"
            style={{ left: `${(hub.x / 400) * 100}%`, top: `${(hub.y / 380) * 100}%` }}
          >
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              You
            </span>
            <span className="text-[10px] font-medium text-muted">Ghanta Ghar</span>
          </div>
        </div>
      </div>
    </section>
  );
}
