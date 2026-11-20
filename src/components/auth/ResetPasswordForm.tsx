"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";
import Alert from "@/components/ui/Alert";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setSuccess("Password reset! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-[28px] leading-tight font-extrabold">Link not valid</h1>
        <Alert type="error" message="This reset link is invalid or incomplete. Please request a new one." />
        <Link href="/forgot-password" className="font-semibold text-primary-fg hover:underline">
          Send me a new link →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[28px] leading-tight font-extrabold">Set a new password</h1>
        <p className="mt-1 text-[15px] text-muted">Choose something you haven&apos;t used before.</p>
      </header>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {!success && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            hint="At least 8 characters, with 1 capital letter and 1 number."
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <PasswordInput
            label="Confirm new password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />
          <Button type="submit" size="lg" loading={loading}>
            Reset password
          </Button>
        </form>
      )}
    </div>
  );
}