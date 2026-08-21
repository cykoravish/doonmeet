import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

// Outer nodes arranged around a central hub — the "network of connections" motif
const nodes = [
  { x: 90, y: 70, r: 5, tone: "primary-light", pulseDelay: "0s" },
  { x: 200, y: 40, r: 4, tone: "accent", pulseDelay: "0.6s" },
  { x: 310, y: 75, r: 6, tone: "primary-light", pulseDelay: "1.1s" },
  { x: 340, y: 170, r: 4, tone: "primary", pulseDelay: "0.3s" },
  { x: 300, y: 260, r: 5, tone: "accent", pulseDelay: "1.6s" },
  { x: 195, y: 295, r: 4, tone: "primary-light", pulseDelay: "0.9s" },
  { x: 80, y: 255, r: 6, tone: "primary", pulseDelay: "0.2s" },
  { x: 45, y: 165, r: 4, tone: "accent", pulseDelay: "1.4s" },
];

const hub = { x: 200, y: 165 };

const toneFill: Record<string, string> = {
  primary: "fill-primary",
  "primary-light": "fill-primary-light",
  accent: "fill-accent",
};

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

        {/* Network of connections illustration */}
        <div className="relative mx-auto flex w-full max-w-md items-center justify-center lg:max-w-none">
          {/* Soft ambient glow behind the network — single small blurred orb, cheap */}
          <div className="absolute h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute h-40 w-40 translate-x-16 -translate-y-10 rounded-full bg-accent/10 blur-3xl" />

          <svg
            viewBox="0 0 400 340"
            className="relative h-auto w-full"
            role="img"
            aria-label="Illustration of a network of connected people, representing Dehradun locals linking up on DoonMeet"
          >
            {/* Spokes from hub to each node */}
            <g stroke="rgb(var(--primary-light))" strokeWidth="1.25" opacity="0.35">
              {nodes.map((n, i) => (
                <line key={i} x1={hub.x} y1={hub.y} x2={n.x} y2={n.y} />
              ))}
            </g>

            {/* Outer ring connecting neighbouring nodes */}
            <polygon
              points={nodes.map((n) => `${n.x},${n.y}`).join(" ")}
              fill="none"
              stroke="rgb(var(--border))"
              strokeWidth="1"
              opacity="0.6"
            />

            {/* Traveling pulses along two spokes — suggests messages flowing */}
            <circle r="3" className="fill-accent">
              <animateMotion
                dur="3.5s"
                repeatCount="indefinite"
                path={`M${hub.x} ${hub.y} L${nodes[2].x} ${nodes[2].y}`}
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.1;0.85;1"
                dur="3.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle r="3" className="fill-primary-light">
              <animateMotion
                dur="4.2s"
                begin="1.2s"
                repeatCount="indefinite"
                path={`M${hub.x} ${hub.y} L${nodes[6].x} ${nodes[6].y}`}
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.1;0.85;1"
                dur="4.2s"
                begin="1.2s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Outer nodes */}
            {nodes.map((n, i) => (
              <g key={i}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r + 6}
                  className={`${toneFill[n.tone]}`}
                  opacity="0.12"
                />
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
        </div>
      </div>
    </section>
  );
}
