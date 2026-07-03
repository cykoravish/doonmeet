import Link from "next/link";
import { MapPin } from "lucide-react";
import Image from "next/image";

const links = {
  Explore: [
    { label: "Locations", href: "/locations" },
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
  ],
};

export default function Footer() {
  return (
    <footer
      className="hidden border-t md:block"
      style={{
        backgroundColor: "rgb(var(--surface))",
        borderColor: "rgb(var(--border))",
      }}
    >
    <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.8fr)_repeat(3,minmax(140px,1fr))]">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2">
              <Image
                src="/doonmeet-light.png"
                alt="DoonMeet"
                width={52}
                height={52}
                className="logo-light h-13 w-13 object-contain transition-transform group-hover:scale-105"
                priority
              />
              <Image
                src="/doonmeet-dark.png"
                alt="DoonMeet"
                width={52}
                height={52}
                className="logo-dark h-13 w-13 object-contain transition-transform group-hover:scale-105"
                priority
              />
              <span className="font-black" style={{ color: "rgb(var(--primary))" }}>
                DoonMeet
              </span>
            </Link>
            <p
              className="mb-4 max-w-xs text-sm leading-relaxed"
              style={{ color: "rgb(var(--muted))" }}
            >
              Dehradun&apos;s own social platform. Connect with locals, discover events and explore
              the Doon Valley together.
            </p>
            <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
              © {new Date().getFullYear()} DoonMeet · doonmeet.in
            </p>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <p
                className="mb-4 inline-block border-b-2 pb-2 text-xs font-bold uppercase tracking-widest"
                style={{
                  color: "rgb(var(--muted))",
                  borderColor: "rgb(var(--primary))",
                }}
              >
                {section}
              </p>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm transition-opacity hover:opacity-80"
                      style={{ color: "rgb(var(--text))" }}
                    >
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
