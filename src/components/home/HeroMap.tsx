import { DEHRADUN_ROADS } from "@/data/dehradun-roads-data";

// Every coordinate below is projected from real lat/lng data of Dehradun —
// this isn't a decorative shape, it's the actual Doon valley outline, just
// drawn small and static for the hero. Landmarks sit at their true position
// relative to each other.

// Real boundary (NW → SE), projected to the 400×380 viewBox. Hoisted out of
// the component so it isn't re-allocated on every render.
const DEHRADUN_BOUNDARY_PATH =
  "M 397.3,27.3 L 378.3,23.2 L 288.3,33.1 L 283.4,40.6 L 285.0,53.8 L 275.1,82.7 L 259.4,95.9 " +
  "L 244.6,96.7 L 229.7,92.6 L 219.8,97.5 L 181.8,152.0 L 172.8,155.3 L 145.5,154.5 L 115.0,166.9 " +
  "L 102.6,163.6 L 43.1,175.1 L 46.4,209.0 L 64.6,240.4 L 91.0,240.4 L 114.1,261.0 L 116.6,268.4 " +
  "L 108.3,290.7 L 116.6,313.0 L 129.8,317.2 L 136.4,314.7 L 144.7,317.2 L 149.6,323.8 L 152.1,345.2 " +
  "L 170.3,360.1 L 238.8,382.4 L 242.9,381.6 L 262.8,355.1 L 283.4,346.1 L 290.8,348.5 L 305.7,361.7 " +
  "L 315.6,343.6 L 327.2,337.8 L 337.1,341.9 L 344.5,351.0 L 357.7,357.6 L 363.5,364.2 L 362.7,350.2 " +
  "L 356.9,337.8 L 363.5,305.6 L 361.0,289.9 L 363.5,275.0 L 368.4,268.4 L 388.3,262.7 L 402.3,249.4 " +
  "L 401.5,245.3 L 383.3,241.2 L 375.9,235.4 L 363.5,217.2 L 360.2,204.9 L 362.7,196.6 L 372.6,184.2 " +
  "L 364.3,161.1 L 366.0,140.5 L 389.1,119.0 L 400.6,94.2 L 397.3,71.9 Z";

// One data-driven landmark list instead of ~230 lines of hand-repeated
// dot + ring + text JSX. Ghanta Ghar (city centre / "you are here") stays
// hardcoded below since it's visually unique (extra core).
type Landmark = {
  name: string;
  x: number;
  y: number;
  color: "primary" | "accent";
  dotR: number;
  dotOpacity: number;
  ringR: number;
  ringOpacity: number;
  ringWidth: number;
  labelDx: number;
  labelDy: number;
  labelOpacity: number;
  fontSize: number;
};

const LANDMARKS: Landmark[] = [
  {
    name: "FRI",
    x: 128.2,
    y: 172.9,
    color: "primary",
    dotR: 3,
    dotOpacity: 0.85,
    ringR: 7,
    ringOpacity: 0.22,
    ringWidth: 0.8,
    labelDx: -7.2,
    labelDy: -2.9,
    labelOpacity: 0.65,
    fontSize: 7,
  },
  {
    name: "Robber's Cave",
    x: 245,
    y: 112,
    color: "accent",
    dotR: 3,
    dotOpacity: 0.9,
    ringR: 8,
    ringOpacity: 0.22,
    ringWidth: 0.8,
    labelDx: 5,
    labelDy: -4,
    labelOpacity: 0.65,
    fontSize: 7,
  },
  {
    name: "Tapkeshwar",
    x: 210,
    y: 137,
    color: "accent",
    dotR: 2.8,
    dotOpacity: 0.9,
    ringR: 7,
    ringOpacity: 0.22,
    ringWidth: 0.8,
    labelDx: -7,
    labelDy: -3,
    labelOpacity: 0.65,
    fontSize: 7,
  },
  {
    name: "Dehradun Zoo",
    x: 292,
    y: 78,
    color: "primary",
    dotR: 3,
    dotOpacity: 0.9,
    ringR: 8,
    ringOpacity: 0.22,
    ringWidth: 0.8,
    labelDx: 5,
    labelDy: -4,
    labelOpacity: 0.65,
    fontSize: 7,
  },
  {
    name: "Rajpur Road",
    x: 230,
    y: 176,
    color: "accent",
    dotR: 2.8,
    dotOpacity: 0.85,
    ringR: 7,
    ringOpacity: 0.2,
    ringWidth: 0.8,
    labelDx: 8,
    labelDy: -2,
    labelOpacity: 0.7,
    fontSize: 7,
  },
  {
    name: "ISBT",
    x: 157,
    y: 300,
    color: "primary",
    dotR: 2.8,
    dotOpacity: 0.8,
    ringR: 6,
    ringOpacity: 0.18,
    ringWidth: 0.7,
    labelDx: 7,
    labelDy: 3,
    labelOpacity: 0.6,
    fontSize: 6.5,
  },
  {
    name: "Majra",
    x: 155,
    y: 280,
    color: "accent",
    dotR: 2.3,
    dotOpacity: 0.7,
    ringR: 5.5,
    ringOpacity: 0.14,
    ringWidth: 0.7,
    labelDx: -28,
    labelDy: 3,
    labelOpacity: 0.55,
    fontSize: 6.5,
  },
  {
    name: "Banjara Wala",
    x: 205,
    y: 326,
    color: "primary",
    dotR: 2.4,
    dotOpacity: 0.7,
    ringR: 5.5,
    ringOpacity: 0.14,
    ringWidth: 0.7,
    labelDx: 7,
    labelDy: 3,
    labelOpacity: 0.55,
    fontSize: 6.5,
  },
  {
    name: "Jogiwala",
    x: 285,
    y: 295,
    color: "primary",
    dotR: 2.5,
    dotOpacity: 0.75,
    ringR: 6,
    ringOpacity: 0.15,
    ringWidth: 0.7,
    labelDx: 7,
    labelDy: 3,
    labelOpacity: 0.58,
    fontSize: 6.5,
  },
  {
    name: "Raipur",
    x: 337,
    y: 270,
    color: "accent",
    dotR: 2.5,
    dotOpacity: 0.75,
    ringR: 6,
    ringOpacity: 0.15,
    ringWidth: 0.7,
    labelDx: -27,
    labelDy: -7,
    labelOpacity: 0.58,
    fontSize: 6.5,
  },
  {
    name: "Harrawala",
    x: 350,
    y: 320,
    color: "primary",
    dotR: 2.4,
    dotOpacity: 0.7,
    ringR: 5.5,
    ringOpacity: 0.13,
    ringWidth: 0.7,
    labelDx: -38,
    labelDy: 3,
    labelOpacity: 0.52,
    fontSize: 6.5,
  },
];

// Static, desktop-only Dehradun map (real boundary, roads and landmarks).
// Rendered display:none below lg, so phones pay nothing for it. No
// animation and no blur glow — it's decoration, it shouldn't cost frames.
export default function HeroMap() {
  return (
    <div className="relative hidden w-full items-center justify-center lg:flex" aria-hidden="true">
          <svg
            viewBox="0 0 400 380"
            className="relative h-auto w-full overflow-visible"
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

            {/* Soft outer glow — merged from two overlapping strokes into one */}
            <path
              d={DEHRADUN_BOUNDARY_PATH}
              fill="none"
              stroke="rgb(var(--primary-light))"
              strokeWidth="9"
              opacity="0.1"
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
            {/* Ghanta Ghar — city centre, doubles as "you are here" */}
            <g transform="translate(197 198)" pointerEvents="none">
              <circle r="9" fill="rgb(var(--primary-light))" opacity="0.1" />

              <circle r="3.5" fill="rgb(var(--primary-light))" />
              <circle r="1.5" fill="rgb(var(--background))" />

              <text
                x="2"
                y="-4"
                fontSize="7"
                fill="rgb(var(--primary-light))"
                opacity="0.8"
                fontFamily="inherit"
              >
                Ghanta Ghar
              </text>
            </g>

            {/* Every other landmark — one data-driven loop instead of
                repeated dot + ring + text JSX per place */}
            {LANDMARKS.map((lm) => {
              const stroke =
                lm.color === "accent" ? "rgb(var(--accent))" : "rgb(var(--primary-light))";

              return (
                <g key={lm.name} transform={`translate(${lm.x} ${lm.y})`} pointerEvents="none">
                  <circle r={lm.dotR} fill={stroke} opacity={lm.dotOpacity} />
                  <circle
                    r={lm.ringR}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={lm.ringWidth}
                    opacity={lm.ringOpacity}
                  />
                  <text
                    x={lm.labelDx}
                    y={lm.labelDy}
                    fontSize={lm.fontSize}
                    fill={stroke}
                    opacity={lm.labelOpacity}
                    fontFamily="inherit"
                  >
                    {lm.name}
                  </text>
                </g>
              );
            })}

            {/* Boundary — static dashed outline (no longer continuously
                animated; that was the single most expensive repaint in this
                illustration, running every frame over the most complex path
                here) */}
            <path
              d={DEHRADUN_BOUNDARY_PATH}
              fill="none"
              stroke="rgb(var(--primary))"
              strokeWidth="1.6"
              strokeDasharray="2 3"
              opacity="0.85"
              strokeLinecap="round"
            />
          </svg>
    </div>
  );
}
