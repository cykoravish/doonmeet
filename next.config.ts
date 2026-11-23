import fs from "fs";
import path from "path";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_SERVER } from "next/constants";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Old URLs Google still has in its index. The Locations feature was renamed
  // to Places (same slugs), so send visitors and link value to the new pages
  // instead of a 404. Permanent (308) so Google swaps the URL in its index.
  async redirects() {
    return [
      { source: "/locations", destination: "/places", permanent: true },
      { source: "/locations/:slug", destination: "/places/:slug", permanent: true },
    ];
  },
};

// Build-output folder. `next build` empties its output folder before it
// starts, so building into the folder the live site runs from broke pages
// for the whole build. Production deploys (scripts/deploy.sh) therefore
// build into a spare slot (.next-a / .next-b, passed as NEXT_DIST_DIR) while
// the site keeps running from the other one, then write the live slot to
// .next-active, which the production server reads here. Local dev and plain
// `npm run build` keep using ".next".
const SLOT = /^\.next(-[ab])?$/;

function distDir(phase: string): string {
  const fromDeploy = process.env.NEXT_DIST_DIR?.trim();
  if (fromDeploy && SLOT.test(fromDeploy)) return fromDeploy;
  if (phase === PHASE_PRODUCTION_SERVER) {
    try {
      const active = fs.readFileSync(path.join(process.cwd(), ".next-active"), "utf8").trim();
      if (SLOT.test(active)) return active;
    } catch {
      // No deploy has written it (e.g. a local `npm start`) — use the default.
    }
  }
  return ".next";
}

export default function config(phase: string): NextConfig {
  return { ...nextConfig, distDir: distDir(phase) };
}
