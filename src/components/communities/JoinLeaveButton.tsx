"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";

interface JoinLeaveButtonProps {
  slug: string;
  isMember: boolean;
  isLoggedIn: boolean;
  /** @deprecated colours now come from theme tokens; kept so old call sites compile. */
  color?: string;
}

export default function JoinLeaveButton({ slug, isMember: initialIsMember, isLoggedIn }: JoinLeaveButtonProps) {
  const router = useRouter();
  const [isMember, setIsMember] = useState(initialIsMember);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <Link href="/login" className={buttonClasses("primary", "md", "w-full")}>
        Log in to join
      </Link>
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
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={isMember}
      className={buttonClasses(isMember ? "outline" : "primary", "md", "w-full")}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      ) : isMember ? (
        <Check size={18} aria-hidden="true" />
      ) : (
        <Plus size={18} aria-hidden="true" />
      )}
      {isMember ? "Joined" : "Join community"}
    </button>
  );
}
