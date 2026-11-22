// How a post photo sits in the feed — Instagram-style: show it in its own
// shape, clamped between 4:5 (tall) and 1.91:1 (wide). Inside that range it
// fills its box exactly (nothing cut off); outside it, or when the size is
// unknown (older posts), it is letterboxed with object-contain — never cropped.
const MIN_RATIO = 4 / 5;
const MAX_RATIO = 1.91;
const FALLBACK_RATIO = 4 / 3;

export function photoLayout(width?: number | null, height?: number | null): {
  aspectRatio: number;
  fit: "cover" | "contain";
} {
  if (!width || !height || width <= 0 || height <= 0) {
    return { aspectRatio: FALLBACK_RATIO, fit: "contain" };
  }
  const ratio = width / height;
  const clamped = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
  return { aspectRatio: clamped, fit: clamped === ratio ? "cover" : "contain" };
}
