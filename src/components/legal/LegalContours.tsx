// Decorative topographic contour lines — a quiet nod to the Doon Valley
// hills, used as a background motif on legal pages instead of a generic
// gradient blob. Pure decoration: aria-hidden, no interaction.
export default function LegalContours({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 320"
      fill="none"
      aria-hidden="true"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <path
        d="M-20 260 C 140 210, 220 300, 360 250 C 480 210, 560 150, 700 190 C 800 215, 860 190, 920 205"
        stroke="rgb(var(--primary))"
        strokeOpacity="0.14"
        strokeWidth="1.5"
      />
      <path
        d="M-20 220 C 120 165, 240 250, 380 205 C 500 168, 580 110, 720 150 C 810 175, 870 155, 920 168"
        stroke="rgb(var(--primary))"
        strokeOpacity="0.18"
        strokeWidth="1.5"
      />
      <path
        d="M-20 180 C 110 120, 250 195, 390 155 C 510 120, 590 70, 730 108 C 815 132, 870 118, 920 128"
        stroke="rgb(var(--accent))"
        strokeOpacity="0.16"
        strokeWidth="1.5"
      />
      <path
        d="M-20 140 C 100 78, 260 145, 400 100 C 520 65, 600 25, 740 60 C 820 82, 872 72, 920 80"
        stroke="rgb(var(--primary))"
        strokeOpacity="0.12"
        strokeWidth="1.5"
      />
      <path
        d="M-20 100 C 90 42, 270 100, 410 55 C 530 18, 610 -15, 750 15"
        stroke="rgb(var(--accent))"
        strokeOpacity="0.1"
        strokeWidth="1.5"
      />
    </svg>
  );
}