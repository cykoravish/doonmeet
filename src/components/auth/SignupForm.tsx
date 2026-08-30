"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import Divider from "@/components/ui/Divider";
import GoogleButton from "./GoogleButton";
import Link from "next/link";

export default function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
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
            ? "This email is linked to Google. Please sign in with Google."
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
        <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
          Join DoonMeet and connect with Dehradun
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Google */}
      <GoogleButton
        loading={googleLoading}
        onSuccess={handleGoogle}
        onError={() => setError("Google sign in failed.")}
      />

      <Divider label="or sign up with email" />

      {/* Form */}
      <form onSubmit={handleSignup} className="flex flex-col gap-3">
        <Input
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3"
            style={{ color: "rgb(var(--muted))" }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          Min 8 characters, 1 uppercase, 1 number
        </p>
        <Button type="submit" loading={loading}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm" style={{ color: "rgb(var(--muted))" }}>
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold hover:underline"
          style={{ color: "rgb(var(--primary))" }}
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
