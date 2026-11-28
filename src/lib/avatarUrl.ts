// Profile photo URLs, shared by server and browser code.

const GOOGLE_SIZE = /=s\d+(-c)?$/;

/**
 * The biggest sensible version of a profile photo, for full-screen viewing.
 * Google sign-in photos are stored as a tiny 96px thumbnail ("…=s96-c"), so
 * ask Google for an 800px one instead. Our own Cloudinary uploads are
 * already stored at full size — returned unchanged.
 */
export function fullSizeAvatarUrl(src: string): string {
  try {
    if (new URL(src).hostname === "lh3.googleusercontent.com" && GOOGLE_SIZE.test(src)) {
      return src.replace(GOOGLE_SIZE, "=s800-c");
    }
  } catch {
    // Not an absolute URL (e.g. a blob: preview) — use as is.
  }
  return src;
}
