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

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setUnverifiedEmail(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "USE_GOOGLE_LOGIN") {
          setError("This account uses Google login. Tap “Continue with Google” above.");
        } else if (data.code === "EMAIL_UNVERIFIED") {
          setError("Please verify your email first — we sent you a 4-digit code.");
          setUnverifiedEmail(form.email);
        } else {
          setError(data.message ?? "Invalid email or password.");
        }
        return;
      }
      router.push("/");
      router.refresh();
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
        <h1 className="text-[28px] leading-tight font-extrabold">Welcome back</h1>
        <p className="mt-1 text-[15px] text-muted">Log in and see what&apos;s happening in Doon.</p>
      </header>

      {error && <Alert type="error" message={error} />}
      {unverifiedEmail && (
        <Link
          href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
          className="-mt-2 text-sm font-semibold text-primary-fg hover:underline"
        >
          Enter my verification code →
        </Link>
      )}

      <GoogleButton
        label="Continue with Google"
        loading={googleLoading}
        onSuccess={handleGoogle}
        onError={() => setError("Google sign in failed.")}
      />

      <Divider label="or with email" />

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <div className="flex flex-col gap-1">
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Link
            href="/forgot-password"
            className="flex min-h-10 items-center self-end text-sm font-semibold text-primary-fg hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" loading={loading}>
          Log in
        </Button>
      </form>

      <p className="text-center text-[15px] text-muted">
        New to DoonMeet?{" "}
        <Link href="/signup" className="font-semibold text-primary-fg hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  );
}
