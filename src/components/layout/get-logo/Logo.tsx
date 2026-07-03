"use client";

import { useTheme } from "@/providers/theme-provider";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isNight = mounted && resolvedTheme === "night";

  return (
    <Link href="/" className="flex items-center gap-2 group shrink-0" aria-label="DoonMeet home">
      <Image
        src={isNight ? "/doonmeet-dark.png" : "/doonmeet-light.png"}
        alt="DoonMeet — Meet People, Events & Communities in Dehradun"
        width={52}
        height={52}
        className="h-13 w-13 object-contain transition-transform group-hover:scale-105"
        priority
        fetchPriority="high"
      />
    </Link>
  );
}