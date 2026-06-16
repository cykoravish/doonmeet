import Link from "next/link";
import MobileMenu from "./MobileMenu";

const navLinks = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Map",
    href: "/map",
  },
  {
    label: "Chat",
    href: "/chat",
  },
  {
    label: "Events",
    href: "/events",
  },
  {
    label: "Communities",
    href: "/communities",
  },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2 transition-all duration-300">
          <span className="text-xl font-bold tracking-tight">
            Doon
            <span className="text-primary transition-colors duration-300">Meet</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-5 min-[750px]:flex lg:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/80 transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth */}
        <div className="hidden items-center gap-8 min-[750px]:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-foreground/80 transition-colors duration-200 hover:text-foreground"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:opacity-90 lg:rounded-xl lg:px-4"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="min-[750px]:hidden">
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}
