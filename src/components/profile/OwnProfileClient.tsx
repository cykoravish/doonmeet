"use client";

import { useState } from "react";
import { MapPin, Settings, Shield, KeyRound, LogOut, Check, X } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import EditProfileForm from "./EditProfileForm";
import PrivacySettings from "./PrivacySettings";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Alert";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Tab = "profile" | "privacy" | "security";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string;
  gender: string;
  address: string;
  interests: string[];
  phone: string;
  role: string;
  isGuest: boolean;
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    showGender: boolean;
    showAddress: boolean;
    showInterests: boolean;
  };
  createdAt: string;
  hasPassword: boolean;
}

export default function OwnProfileClient({ user }: { user: User }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [currentUser, setCurrentUser] = useState(user);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profile", icon: <Settings size={15} /> },
    { key: "privacy", label: "Privacy", icon: <Shield size={15} /> },
    { key: "security", label: "Security", icon: <KeyRound size={15} /> },
  ];

  const joinedDate = new Date(currentUser.createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen">
      {/* Profile hero */}
      <div
        className="border-b py-12"
        style={{
          background: "linear-gradient(135deg, rgb(var(--primary) / 0.08) 0%, transparent 60%)",
          borderColor: "rgb(var(--border))",
        }}
      >
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex items-start gap-6">
            <ProfileAvatar
              avatar={currentUser.avatar}
              name={currentUser.name}
              editable
              size={96}
              onUpdate={(url) => setCurrentUser((prev) => ({ ...prev, avatar: url }))}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black">{currentUser.name}</h1>
                  <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
                    {currentUser.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
                  style={{
                    borderColor: "rgb(220 38 38 / 0.3)",
                    color: "rgb(220 38 38)",
                  }}
                >
                  <LogOut size={13} />
                  Log out
                </button>
              </div>

              {currentUser.bio && (
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgb(var(--muted))" }}>
                  {currentUser.bio}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {currentUser.address && (
                  <div
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "rgb(var(--muted))" }}
                  >
                    <MapPin size={11} />
                    {currentUser.address}
                  </div>
                )}
                <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                  Joined {joinedDate}
                </div>
              </div>

              {/* Interests */}
              {currentUser.interests?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {currentUser.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                      style={{
                        backgroundColor: "rgb(var(--primary) / 0.1)",
                        color: "rgb(var(--primary))",
                      }}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Tab nav */}
        <div
          className="mb-6 flex gap-1 rounded-xl border p-1"
          style={{
            borderColor: "rgb(var(--border))",
            backgroundColor: "rgb(var(--surface))",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all"
              style={{
                backgroundColor: activeTab === tab.key ? "rgb(var(--primary))" : "transparent",
                color: activeTab === tab.key ? "white" : "rgb(var(--muted))",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div
          className="rounded-2xl border p-6"
          style={{
            borderColor: "rgb(var(--border))",
            backgroundColor: "rgb(var(--surface))",
          }}
        >
          {activeTab === "profile" && (
            <EditProfileForm
              initialData={{
                name: currentUser.name,
                bio: currentUser.bio ?? "",
                gender: currentUser.gender ?? "",
                address: currentUser.address ?? "",
                interests: currentUser.interests ?? [],
                phone: currentUser.phone ?? "",
              }}
              onSuccess={(updated) => setCurrentUser((prev) => ({ ...prev, ...updated }))}
            />
          )}

          {activeTab === "privacy" && (
            <div>
              <div className="mb-5">
                <h2 className="font-bold">Privacy Settings</h2>
                <p className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
                  Control what other people can see on your public profile.
                </p>
              </div>
              <PrivacySettings initialPrivacy={currentUser.privacy} />
            </div>
          )}

          {activeTab === "security" && (
            <div>
              <div className="mb-5">
                <h2 className="font-bold">Security</h2>
                <p className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
                  Manage your password and account security.
                </p>
              </div>
              <ChangePasswordForm hasPassword={currentUser.hasPassword} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline change password form
function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);

  const rules = [
    { label: "At least 8 characters", valid: form.newPassword.length >= 8 },
    { label: "One uppercase letter (A-Z)", valid: /[A-Z]/.test(form.newPassword) },
    { label: "One number (0-9)", valid: /[0-9]/.test(form.newPassword) },
  ];
  const allValid = rules.every((r) => r.valid);
  const passwordsMatch =
    form.confirmPassword.length === 0 || form.newPassword === form.confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError("");
    setSuccess("");

    if (!allValid) {
      setError("Please meet all password requirements below.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const body = hasPassword
        ? {
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
            confirmPassword: form.confirmPassword,
          }
        : { password: form.newPassword, confirmPassword: form.confirmPassword };

      const res = await fetch("/api/users/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        // Prefer the specific field-level reason over the generic message
        const fieldError = data.errors?.[0]?.message;
        setError(fieldError || data.message || "Something went wrong.");
        return;
      }

      setSuccess(data.message || "Password saved successfully!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTouched(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {!hasPassword && (
        <Alert
          type="info"
          message="You signed up with Google — set a password here to also enable email login."
        />
      )}

      {hasPassword && (
        <Input
          label="Current Password"
          type={show ? "text" : "password"}
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          required
        />
      )}

      <div>
        <Input
          label={hasPassword ? "New Password" : "Set Password"}
          type={show ? "text" : "password"}
          value={form.newPassword}
          onChange={(e) => {
            setForm({ ...form, newPassword: e.target.value });
            setTouched(true);
          }}
          required
        />

        {/* Live requirements checklist */}
        {(touched || form.newPassword.length > 0) && (
          <ul className="mt-2 space-y-1">
            {rules.map((rule) => (
              <li
                key={rule.label}
                className="flex items-center gap-1.5 text-xs"
                style={{
                  color: rule.valid ? "rgb(var(--primary))" : "rgb(var(--muted))",
                }}
              >
                {rule.valid ? <Check size={13} /> : <X size={13} />}
                {rule.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <Input
          label="Confirm New Password"
          type={show ? "text" : "password"}
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
        />
        {form.confirmPassword.length > 0 && (
          <p
            className="mt-1.5 flex items-center gap-1.5 text-xs"
            style={{
              color: passwordsMatch ? "rgb(var(--primary))" : "rgb(220 38 38)",
            }}
          >
            {passwordsMatch ? <Check size={13} /> : <X size={13} />}
            {passwordsMatch ? "Passwords match" : "Passwords do not match"}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="show"
          checked={show}
          onChange={(e) => setShow(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="show" className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          Show passwords
        </label>
      </div>

      <Button type="submit" loading={loading}>
        {hasPassword ? "Change Password" : "Set Password"}
      </Button>
    </form>
  );
}
