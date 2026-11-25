import Link from "next/link";
import Logo from "./get-logo/Logo";
import { isSupportEnabled } from "@/lib/support";
import { getAllCategoryLandings } from "@/data/categoryLandings";

const links = {
  // Local landing pages — linked from every page so people (and search
  // engines) can always reach them.
  "In Dehradun": [
    ...getAllCategoryLandings().map((l) => ({
      label: l.slug === "ask" ? "Ask Dehradun" : `${l.label} in Dehradun`,
      href: `/dehradun/${l.slug}`,
    })),
    { label: "Places to Visit", href: "/places" },
  ],
  Explore: [
    { label: "Posts", href: "/posts" },
    { label: "Events", href: "/events" },
    { label: "Communities", href: "/communities" },
    { label: "Chat", href: "/chat" },
  ],
  Account: [
    { label: "Sign up", href: "/signup" },
    { label: "Log in", href: "/login" },
    { label: "Profile", href: "/profile" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund & Cancellation", href: "/refund-policy" },
    { label: "Grievance Redressal", href: "/grievance" },
  ],
};

export default function Footer() {
  return (
    <footer className="hidden border-t md:block bg-surface border-border">
      <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[minmax(260px,1.6fr)_repeat(4,minmax(140px,1fr))]">
          {/* Brand */}
          <div>
            <Logo />
            <p className="mb-4 max-w-xs text-sm leading-relaxed text-muted">
              Dehradun&apos;s own social platform. Connect with locals, discover events and explore
              the Doon Valley together.
            </p>
            <p className="text-[13px] text-muted">© {new Date().getFullYear()} DoonMeet · doonmeet.in</p>
          </div>

          {/* Links */}
          {Object.entries({
            ...links,
            Explore: isSupportEnabled() ? [...links.Explore, { label: "Support DoonMeet", href: "/support" }] : links.Explore,
          }).map(([section, items]) => (
            <div key={section}>
              <p className="mb-4 inline-block border-b-2 border-primary pb-2 text-xs font-bold tracking-widest text-muted uppercase">
                {section}
              </p>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-text transition-colors hover:text-primary-fg">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
