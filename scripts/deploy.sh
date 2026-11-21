#!/usr/bin/env bash
# Production deploy. Run on the VPS by .github/workflows/deploy.yml, right
# after the repo was reset to the commit the supply-chain guard checked.
#
# The live site keeps running during the whole build:
#   - `npm ci` deletes node_modules (which the running site still loads
#     modules from), so it only runs when package-lock.json changed - or
#     once a week, to refresh node_modules from the registry anyway.
#   - `next build` empties its output folder first, so we build into the
#     spare slot (.next-a / .next-b) and only then point the app at it
#     (.next-active, read by next.config.ts) and restart. A failed build
#     never touches the live slot.
# After the restart a health check fails the deploy (red run + GitHub email)
# if the site, the chat socket, or the app's stability isn't right.
set -euo pipefail
cd "$(dirname "$0")/.."

APP=doonmeet
BASE=http://localhost:3000

# ---- 1. Dependencies -------------------------------------------------------
LOCK_HASH=$(sha256sum package-lock.json | cut -d' ' -f1)
MARKER=node_modules/.deployed-lock-sha256
if [ ! -f "$MARKER" ] || [ "$(cat "$MARKER")" != "$LOCK_HASH" ] || [ -n "$(find "$MARKER" -mtime +7)" ]; then
  echo "Installing dependencies (package-lock changed, or weekly refresh)..."
  npm ci
  echo "$LOCK_HASH" > "$MARKER"
else
  echo "Dependencies unchanged - skipping npm ci."
fi

# ---- 2. Build into the spare slot -----------------------------------------
ACTIVE=$(cat .next-active 2>/dev/null || echo .next)
if [ "$ACTIVE" = ".next-a" ]; then SLOT=.next-b; else SLOT=.next-a; fi
echo "Building into $SLOT (the live site keeps running from $ACTIVE)..."
# prebuild runs the supply-chain guard again on the server.
NEXT_DIST_DIR=$SLOT npm run build
# The build adds its slot to tsconfig.json "include"; put the committed file
# back so the server checkout stays clean (nothing at runtime needs it).
git checkout -- tsconfig.json || true

# ---- 3. Switch and restart -------------------------------------------------
echo "$SLOT" > .next-active.tmp
mv .next-active.tmp .next-active
echo "Restarting PM2..."
pm2 restart "$APP" --update-env

# ---- 4. Health check -------------------------------------------------------
fail() {
  echo "HEALTH CHECK FAILED: $1"
  echo "The new version is live but not healthy. Check: pm2 logs $APP --lines 100"
  exit 1
}
restarts() {
  pm2 jlist | node -e '
    let s = "";
    process.stdin.on("data", (d) => (s += d)).on("end", () => {
      const list = JSON.parse(s.slice(s.indexOf("[")));
      const p = list.find((x) => x.name === process.argv[1]);
      console.log(p ? p.pm2_env.restart_time : -1);
    });' "$APP"
}
status_of() { curl -s -o /dev/null --max-time 15 -w '%{http_code}' "$BASE$1" || true; }

echo "Waiting for the site to answer..."
up=0
for _ in $(seq 1 45); do
  if [ "$(status_of /)" = 200 ] &&
    curl -s --max-time 10 "$BASE/socket.io/?EIO=4&transport=polling" | grep -q '"sid"'; then
    up=1
    break
  fi
  sleep 2
done
[ "$up" = 1 ] || fail "the site or the chat socket is not answering after the restart"

# Keep using it for ~20s: pages must stay 200 and the app must not restart.
before=$(restarts)
for _ in 1 2 3 4; do
  sleep 5
  for page in / /events /api/users/count; do
    code=$(status_of "$page")
    [ "$code" = 200 ] || fail "$page answered $code"
  done
done
after=$(restarts)
[ "$before" = "$after" ] || fail "the app restarted during the check (crash loop?)"

pm2 save >/dev/null
# The pre-slot build folder isn't needed after the first slot deploy.
if [ "$ACTIVE" = ".next" ] && [ -d .next ]; then rm -rf .next; fi
echo "Deployed $(git rev-parse --short HEAD) from $SLOT - health check passed."
