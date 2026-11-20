import Image from "next/image";

interface AvatarProps {
  name: string;
  src?: string | null;
  /** Rendered size in px (also the intrinsic size requested from next/image). */
  size?: number;
  /** Show the green "online" dot. */
  online?: boolean;
  /**
   * Avatars almost always sit next to the person's name, so by default they
   * are decorative (empty alt). Set true when the avatar stands alone.
   */
  labelled?: boolean;
  className?: string;
}

// Theme-aware tints — the initial colour stays stable per person.
const TINTS = [
  "bg-primary-soft text-primary-fg",
  "bg-accent-soft text-accent-fg",
  "bg-surface-2 text-text",
];

function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

export default function Avatar({
  name,
  src,
  size = 40,
  online = false,
  labelled = false,
  className = "",
}: AvatarProps) {
  const dot = Math.max(8, Math.round(size * 0.26));

  return (
    <span
      className={`relative inline-flex shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={labelled ? name : ""}
          width={size}
          height={size}
          sizes={`${size}px`}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span
          role={labelled ? "img" : undefined}
          aria-label={labelled ? name : undefined}
          aria-hidden={labelled ? undefined : true}
          className={`flex h-full w-full items-center justify-center rounded-full font-bold ${tintFor(name)}`}
          style={{ fontSize: Math.round(size * 0.38) }}
        >
          {initialsOf(name)}
        </span>
      )}
      {online && (
        <span
          className="absolute right-0 bottom-0 rounded-full border-2 border-surface bg-online"
          style={{ width: dot, height: dot }}
        >
          <span className="sr-only">Online</span>
        </span>
      )}
    </span>
  );
}
