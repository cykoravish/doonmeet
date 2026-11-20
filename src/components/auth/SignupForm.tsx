"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Alert from "@/components/ui/Alert";
import Divider from "@/components/ui/Divider";
import GoogleButton from "./GoogleButton";

export default function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.code === "USE_GOOGLE_LOGIN"
            ? "This email is linked to Google. Please continue with Google."
            : (data.errors?.[0]?.message ?? data.message)
        );
        return;
      }
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(accessToken: string) {
    setGoogleLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: accessToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[28px] leading-tight font-extrabold">Join DoonMeet</h1>
        <p className="mt-1 text-[15px] text-muted">Free forever. Meet people, find events, join communities.</p>
      </header>

      {error && <Alert type="error" message={error} />}

      {/* Google first — fastest way in on a phone (no password to type) */}
      <GoogleButton loading={googleLoading} onSuccess={handleGoogle} onError={() => setError("Google sign in failed.")} />

      <Divider label="or with email" />

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        <Input
          label="Your name"
          autoComplete="name"
          autoCapitalize="words"
          placeholder="e.g. Aman Negi"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          maxLength={50}
          required
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          hint="We'll send a 4-digit code to verify it."
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          hint="At least 8 characters, with 1 capital letter and 1 number."
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <Button type="submit" size="lg" loading={loading}>
          Create free account
        </Button>
        <p className="text-center text-sm text-muted">
          By signing up you agree to our{" "}
          <Link href="/terms" className="font-semibold text-text underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-text underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p className="text-center text-[15px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary-fg hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
