// The visitor's IP address, as our nginx saw it.
//
// nginx sets X-Real-IP (and X-Forwarded-For) to the connecting address,
// replacing whatever the browser sent, so these can't be faked. Without them
// every request looks like it comes from nginx itself (127.0.0.1) and all
// visitors would share one rate-limit bucket. X-Forwarded-For is only a
// fallback for local development.
export function getClientIp(headers: Headers): string | null {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || null;
}
