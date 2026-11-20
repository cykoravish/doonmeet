"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";

interface RSVPButtonProps {
  slug: string;
  isGoing: boolean;
  isFull: boolean;
  isLoggedIn: boolean;
}

export default function RSVPButton({ slug, isGoing: initialIsGoing, isFull, isLoggedIn }: RSVPButtonProps) {
  const router = useRouter();
  const [isGoing, setIsGoing] = useState(initialIsGoing);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <Link href="/login" className={buttonClasses("primary", "lg", "w-full")}>
        Log in to RSVP
      </Link>
    );
  }

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${slug}/rsvp`, {
        method: isGoing ? "DELETE" : "POST",
      });
      if (res.ok) {
        setIsGoing(!isGoing);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!isGoing && isFull) {
    return (
      <button type="button" disabled className={buttonClasses("secondary", "lg", "w-full")}>
        Event full
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={isGoing}
      className={buttonClasses(isGoing ? "outline" : "primary", "lg", "w-full")}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      ) : isGoing ? (
        <Check size={18} aria-hidden="true" />
      ) : null}
      {isGoing ? "You're going · tap to cancel" : "RSVP — I'm going"}
    </button>
  );
}
