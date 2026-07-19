"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

interface JoinLeaveButtonProps {
  slug: string;
  isMember: boolean;
  isLoggedIn: boolean;
  isGuest: boolean;
  color: string;
}

export default function JoinLeaveButton({
  slug,
  isMember: initialIsMember,
  isLoggedIn,
  isGuest,
  color,
}: JoinLeaveButtonProps) {
  const router = useRouter();
  const [isMember, setIsMember] = useState(initialIsMember);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      
       <a href="/login"
        className="block w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: color }}
      >
        Log in to join
      </a>
    );
  }

  if (isGuest) {
    return (
      
       <a href="/signup"
        className="block w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: color }}
      >
        Sign up to join
      </a>
    );
  }

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/communities/${slug}/${isMember ? "leave" : "join"}`, {
        method: "POST",
      });
      if (res.ok) {
        setIsMember(!isMember);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
      style={
        isMember
          ? { backgroundColor: "rgb(var(--surface))", border: `1px solid ${color}`, color }
          : { backgroundColor: color, color: "white" }
      }
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : isMember ? (
        <Check size={15} />
      ) : null}
      {isMember ? "Joined" : "Join community"}
    </button>
  );
}