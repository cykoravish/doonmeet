"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import Divider from "@/components/ui/Divider";
import GoogleButton from "./GoogleButton";
import GuestLoginButton from "./GuestLoginButton";

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
          setError("This account uses Google login. Please sign in with Google or set a password from settings.");
        } else if (data.code === "EMAIL_UNVERIFIED") {
          setError("Please verify your email first. Check your inbox or resend the link.");
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
      if (!res.ok) { setError(data.message); return; }
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
          Log in to your DoonMeet account
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      <GoogleButton
        label="Continue with Google"
        loading={googleLoading}
        onSuccess={handleGoogle}
        onError={() => setError("Google sign in failed.")}
      />

      <Divider label="or log in with email" />

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
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

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs hover:underline"
            style={{ color: "rgb(var(--primary))" }}
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading}>
          Log in
        </Button>
      </form>

      <Divider label="or" />
      <GuestLoginButton />

      <p className="text-center text-sm" style={{ color: "rgb(var(--muted))" }}>
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold hover:underline"
          style={{ color: "rgb(var(--primary))" }}
        >
          Sign up free
        </Link>
      </p>
    </div>
  );
}