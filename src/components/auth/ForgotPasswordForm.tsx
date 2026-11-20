"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setSuccess(data.message);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/login"
        className="-ml-2 -mb-2 flex min-h-11 w-fit items-center gap-1.5 rounded-[12px] px-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-text"
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Back to login
      </Link>

      <header>
        <h1 className="text-[28px] leading-tight font-extrabold">Forgot password?</h1>
        <p className="mt-1 text-[15px] text-muted">
          No problem. Enter your email and we&apos;ll send you a reset link.
        </p>
      </header>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {!success && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" size="lg" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
    </div>
  );
}