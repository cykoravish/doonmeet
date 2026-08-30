"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

interface RSVPButtonProps {
  slug: string;
  isGoing: boolean;
  isFull: boolean;
  isLoggedIn: boolean;
}

export default function RSVPButton({
  slug,
  isGoing: initialIsGoing,
  isFull,
  isLoggedIn,
}: RSVPButtonProps) {
  const router = useRouter();
  const [isGoing, setIsGoing] = useState(initialIsGoing);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      
       <a href="/login"
        className="block w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "rgb(var(--primary))" }}
      >
        Log in to RSVP
      </a>
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
      <button
        disabled
        className="w-full cursor-not-allowed rounded-xl border py-3 text-center text-sm font-semibold"
        style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
      >
        Event full
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-opacity disabled:opacity-60"
      style={
        isGoing
          ? { backgroundColor: "rgb(var(--surface))", border: "1px solid rgb(var(--primary))", color: "rgb(var(--primary))" }
          : { backgroundColor: "rgb(var(--primary))", color: "white" }
      }
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : isGoing ? <Check size={15} /> : null}
      {isGoing ? "You're going" : "RSVP — I'm going"}
    </button>
  );
}