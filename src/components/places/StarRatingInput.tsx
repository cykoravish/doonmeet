"use client";

import { Star } from "lucide-react";

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
}

const LABELS = ["Poor", "Okay", "Good", "Great", "Loved it"];

// Radio group of 5 stars — 44px tap targets, works with keyboard and
// screen readers ("3 stars, Good").
export default function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  return (
    <div className="flex items-center gap-2">
      <div role="radiogroup" aria-label="Your rating" className="flex items-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? "star" : "stars"}, ${LABELS[n - 1]}`}
            onClick={() => onChange(n)}
            className="flex h-11 w-11 items-center justify-center rounded-[12px] text-accent hover:bg-accent-soft"
          >
            <Star size={28} className={value >= n ? "fill-accent" : ""} aria-hidden="true" />
          </button>
        ))}
      </div>
      {value > 0 && <span className="text-sm font-semibold text-accent-fg">{LABELS[value - 1]}</span>}
    </div>
  );
}
