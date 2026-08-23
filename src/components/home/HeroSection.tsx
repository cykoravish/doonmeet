import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { DEHRADUN_ROADS } from "@/data/dehradun-roads-data";

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

export default function HeroSection() {
  const DEHRADUN_BOUNDARY_PATH = `
  M 397.3,27.3
  L 378.3,23.2
  L 288.3,33.1
  L 283.4,40.6
  L 285.0,53.8
  L 275.1,82.7
  L 259.4,95.9
  L 244.6,96.7
  L 229.7,92.6
  L 219.8,97.5
  L 181.8,152.0
  L 172.8,155.3
  L 145.5,154.5
  L 115.0,166.9
  L 102.6,163.6
  L 43.1,175.1
  L 46.4,209.0
  L 64.6,240.4
  L 91.0,240.4
  L 114.1,261.0
  L 116.6,268.4
  L 108.3,290.7
  L 116.6,313.0
  L 129.8,317.2
  L 136.4,314.7
  L 144.7,317.2
  L 149.6,323.8
  L 152.1,345.2
  L 170.3,360.1
  L 238.8,382.4
  L 242.9,381.6
  L 262.8,355.1
  L 283.4,346.1
  L 290.8,348.5
  L 305.7,361.7
  L 315.6,343.6
  L 327.2,337.8
  L 337.1,341.9
  L 344.5,351.0
  L 357.7,357.6
  L 363.5,364.2
  L 362.7,350.2
  L 356.9,337.8
  L 363.5,305.6
  L 361.0,289.9
  L 363.5,275.0
  L 368.4,268.4
  L 388.3,262.7
  L 402.3,249.4
  L 401.5,245.3
  L 383.3,241.2
  L 375.9,235.4
  L 363.5,217.2
  L 360.2,204.9
  L 362.7,196.6
  L 372.6,184.2
  L 364.3,161.1
  L 366.0,140.5
  L 389.1,119.0
  L 400.6,94.2
  L 397.3,71.9
  Z
`;

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

        {/* Premium Dehradun city map */}
        <div className="relative mx-auto flex w-full max-w-md items-center justify-center lg:max-w-none">
          {/* Ambient premium glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-[15%] top-[12%] h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
          </div>

          <svg
            viewBox="0 0 400 380"
            className="relative h-auto w-full overflow-visible"
            role="img"
            aria-label="Interactive map of Dehradun with Ghanta Ghar at the city centre and connected landmarks"
          >
            <defs>
              {/* Premium map gradient */}
              <linearGradient id="doonMapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0.13" />
                <stop offset="45%" stopColor="rgb(var(--primary-light))" stopOpacity="0.07" />
                <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0.12" />
              </linearGradient>

              {/* Real boundary used as clipping region */}
              <clipPath id="dehradunBoundaryClip">
                <path d={DEHRADUN_BOUNDARY_PATH} />
              </clipPath>
            </defs>

            {/* Soft outer glow */}
            <path
              d={DEHRADUN_BOUNDARY_PATH}
              fill="none"
              stroke="rgb(var(--primary-light))"
              strokeWidth="12"
              opacity="0.08"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            <path
              d={DEHRADUN_BOUNDARY_PATH}
              fill="none"
              stroke="rgb(var(--primary-light))"
              strokeWidth="7"
              opacity="0.12"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Main city body */}
            <path d={DEHRADUN_BOUNDARY_PATH} fill="url(#doonMapGradient)" stroke="none" />

            {/* Dehradun road network */}
            <g
              clipPath="url(#dehradunBoundaryClip)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
            >
              {DEHRADUN_ROADS.map((road) => {
                const styles = {
                  primary: {
                    casing: 3.2,
                    casingOpacity: 0.12,
                    width: 1.25,
                    opacity: 0.48,
                  },
                  secondary: {
                    casing: 2.4,
                    casingOpacity: 0.07,
                    width: 0.9,
                    opacity: 0.3,
                  },
                  tertiary: {
                    casing: 1.7,
                    casingOpacity: 0.035,
                    width: 0.62,
                    opacity: 0.18,
                  },
                } as const;

                const style = styles[road.type];

                return (
                  <g key={road.name}>
                    {/* Soft road casing */}
                    <path
                      d={road.path}
                      stroke="rgb(var(--primary))"
                      strokeWidth={style.casing}
                      opacity={style.casingOpacity}
                    />

                    {/* Road surface */}
                    <path
                      d={road.path}
                      stroke="rgb(var(--primary-light))"
                      strokeWidth={style.width}
                      opacity={style.opacity}
                    />
                  </g>
                );
              })}
            </g>
            {/* Ghanta Ghar — city centre */}
            <g transform="translate(197 198)" pointerEvents="none">
              <circle r="16" fill="rgb(var(--primary-light))" opacity="0.06" />

              <circle r="9" fill="rgb(var(--primary-light))" opacity="0.10" />

              <circle
                className="hero-pulse-ring"
                r="5"
                fill="none"
                stroke="rgb(var(--primary-light))"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                opacity="0.55"
              />

              <circle r="3.5" fill="rgb(var(--primary-light))" />

              <circle r="1.5" fill="rgb(var(--background))" />
            </g>
   
            {/* FRI Campus */}
            <g transform="translate(128.2 172.9)" pointerEvents="none">
              <circle r="3" fill="rgb(var(--primary-light))" opacity="0.85" />

              <circle
                r="7"
                fill="none"
                stroke="rgb(var(--primary-light))"
                strokeWidth="0.8"
                opacity="0.22"
              />

              <circle
                r="11"
                fill="none"
                stroke="rgb(var(--primary-light))"
                strokeWidth="0.5"
                opacity="0.08"
              />
            </g>
            {/* Robber's Cave */}
            <g transform="translate(245 112)" pointerEvents="none">
              <circle r="3" fill="rgb(var(--accent))" opacity="0.9" />

              <circle
                r="8"
                fill="none"
                stroke="rgb(var(--accent))"
                strokeWidth="0.8"
                opacity="0.22"
              />

              <circle
                r="13"
                fill="none"
                stroke="rgb(var(--accent))"
                strokeWidth="0.5"
                opacity="0.08"
              />
            </g>

            <path
              d={DEHRADUN_BOUNDARY_PATH}
              fill="none"
              stroke="rgb(var(--primary-light))"
              strokeWidth="3.5"
              opacity="0.12"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Tapkeshwar Mahadev Mandir */}
            <g transform="translate(210 137)" pointerEvents="none">
              <circle r="2.8" fill="rgb(var(--accent))" opacity="0.9" />
              <circle
                r="7"
                fill="none"
                stroke="rgb(var(--accent))"
                strokeWidth="0.8"
                opacity="0.22"
              />
            </g>

            {/* Dehradun Zoo */}
            <g transform="translate(292 78)" pointerEvents="none">
              <circle r="3" fill="rgb(var(--primary-light))" opacity="0.9" />
              <circle
                r="8"
                fill="none"
                stroke="rgb(var(--primary-light))"
                strokeWidth="0.8"
                opacity="0.22"
              />
            </g>
            {/* Rajpur Road */}
            <g transform="translate(230 176)" pointerEvents="none">
              <circle r="2.8" fill="rgb(var(--accent))" opacity="0.85" />
              <circle
                r="7"
                fill="none"
                stroke="rgb(var(--accent))"
                strokeWidth="0.8"
                opacity="0.20"
              />
            </g>

            {/* Landmark labels */}
            <g
              fontFamily="inherit"
              fontSize="7"
              fill="rgb(var(--primary-light))"
              pointerEvents="none"
            >
              <text x="203" y="134" opacity="0.65">
                Tapkeshwar
              </text>

              <text x="250" y="108" opacity="0.65">
                Robber&apos;s Cave
              </text>

              <text x="297" y="74" opacity="0.65">
                Dehradun Zoo
              </text>

              <text x="121" y="170" opacity="0.65">
                FRI
              </text>

              <text x="238" y="174" fill="rgb(var(--accent))" opacity="0.7">
                Rajpur Road
              </text>

              <text x="199" y="194" fill="rgb(var(--primary-light))" opacity="0.8">
                Ghanta Ghar
              </text>
            </g>

            {/* Southern & Eastern Dehradun locations */}
            <g pointerEvents="none">
              {/* ISBT */}
             <g transform="translate(157 300)">
                <circle r="2.8" fill="rgb(var(--primary-light))" opacity="0.8" />
                <circle
                  r="6"
                  fill="none"
                  stroke="rgb(var(--primary-light))"
                  strokeWidth="0.7"
                  opacity="0.18"
                />
                <text x="7" y="3" fontSize="6.5" fill="rgb(var(--primary-light))" opacity="0.6">
                  ISBT
                </text>
              </g>

              {/* Majra */}
             <g transform="translate(155 280)">
                <circle r="2.3" fill="rgb(var(--accent))" opacity="0.7" />
                <circle
                  r="5.5"
                  fill="none"
                  stroke="rgb(var(--accent))"
                  strokeWidth="0.7"
                  opacity="0.14"
                />
                <text x="-28" y="3" fontSize="6.5" fill="rgb(var(--accent))" opacity="0.55">
                  Majra
                </text>
              </g>

              {/* Banjara Wala */}
              <g transform="translate(205 326)">
                <circle r="2.4" fill="rgb(var(--primary-light))" opacity="0.7" />
                <circle
                  r="5.5"
                  fill="none"
                  stroke="rgb(var(--primary-light))"
                  strokeWidth="0.7"
                  opacity="0.14"
                />
                <text x="7" y="3" fontSize="6.5" fill="rgb(var(--primary-light))" opacity="0.55">
                  Banjara Wala
                </text>
              </g>

              {/* Jogiwala */}
              <g transform="translate(285 295)">
                <circle r="2.5" fill="rgb(var(--primary-light))" opacity="0.75" />
                <circle
                  r="6"
                  fill="none"
                  stroke="rgb(var(--primary-light))"
                  strokeWidth="0.7"
                  opacity="0.15"
                />
                <text x="7" y="3" fontSize="6.5" fill="rgb(var(--primary-light))" opacity="0.58">
                  Jogiwala
                </text>
              </g>

              {/* Raipur */}
              <g transform="translate(337 270)">
                <circle r="2.5" fill="rgb(var(--accent))" opacity="0.75" />
                <circle
                  r="6"
                  fill="none"
                  stroke="rgb(var(--accent))"
                  strokeWidth="0.7"
                  opacity="0.15"
                />
                <text x="-27" y="-7" fontSize="6.5" fill="rgb(var(--accent))" opacity="0.58">
                  Raipur
                </text>
              </g>

              {/* Harrawala */}
              <g transform="translate(350 320)">
                <circle r="2.4" fill="rgb(var(--primary-light))" opacity="0.7" />
                <circle
                  r="5.5"
                  fill="none"
                  stroke="rgb(var(--primary-light))"
                  strokeWidth="0.7"
                  opacity="0.13"
                />
                <text x="-38" y="3" fontSize="6.5" fill="rgb(var(--primary-light))" opacity="0.52">
                  Harrawala
                </text>
              </g>
            </g>

            <path
              className="hero-boundary-dash"
              d={DEHRADUN_BOUNDARY_PATH}
              fill="none"
              stroke="rgb(var(--primary))"
              strokeWidth="1.6"
              strokeDasharray="2 3"
              opacity="0.85"
              strokeLinecap="round"
            />
          </svg>

          <style>{`
            @keyframes heroPulseRing {
              0% {
                transform: scale(1);
                opacity: 0.55;
              }
              100% {
                transform: scale(2.8);
                opacity: 0;
              }
            }

            @keyframes heroBoundaryDash {
              from {
                stroke-dashoffset: 0;
              }
              to {
                stroke-dashoffset: -50;
              }
            }

            .hero-pulse-ring {
              transform-box: fill-box;
              transform-origin: center;
              animation: heroPulseRing 2.5s ease-out infinite;
              will-change: transform, opacity;
            }

            .hero-boundary-dash {
              animation: heroBoundaryDash 8s linear infinite;
            }

            @media (prefers-reduced-motion: reduce) {
              .hero-pulse-ring,
              .hero-boundary-dash {
                animation: none;
              }
            }
          `}</style>
        </div>
      </div>
    </section>
  );
}
