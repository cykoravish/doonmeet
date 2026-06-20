"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function GuestLoginButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleGuest() {
    const name = window.prompt("Enter your display name:");
    if (!name?.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/guest-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        alert(data.message);
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" loading={loading} onClick={handleGuest}>
      Continue as guest
    </Button>
  );
}