import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  /** Show the "DoonMeet" wordmark next to the mark. */
  wordmark?: boolean;
  size?: number;
}

// Server component — both theme variants are rendered and CSS
// (.logo-light / .logo-dark in globals.css) hides the wrong one, so there's
// no client JS and no flash when the theme loads. The hidden image is
// display:none + lazy, so the browser never downloads it.
export default function Logo({ wordmark = true, size = 36 }: LogoProps) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="DoonMeet home">
      <Image
        src="/doonmeet-light.png"
        alt=""
        width={size}
        height={size}
        sizes={`${size}px`}
        className="logo-light object-contain"
        style={{ width: size, height: size }}
      />
      <Image
        src="/doonmeet-dark.png"
        alt=""
        width={size}
        height={size}
        sizes={`${size}px`}
        className="logo-dark object-contain"
        style={{ width: size, height: size }}
      />
      {wordmark && (
        <span className="font-display text-[21px] font-extrabold tracking-tight text-text">
          DoonMeet
        </span>
      )}
    </Link>
  );
}
