"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Settings,
  Shield,
  Bell,
  KeyRound,
  LogOut,
  Check,
  X,
  Newspaper,
  ExternalLink,
} from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import EditProfileForm from "./EditProfileForm";
import PrivacySettings from "./PrivacySettings";
import NotificationSettings from "./NotificationSettings";
import DeleteAccountSection from "./DeleteAccountSection";
import MyPostsTab from "./MyPostsTab";
import BlockedUsersList from "./BlockedUsersList";
import Alert from "@/components/ui/Alert";
import Button, { buttonClasses } from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";

type Tab = "profile" | "posts" | "privacy" | "notifications" | "security";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  bannerImage: string | null;
  bio: string;
  gender: string;
  address: string;
  interests: string[];
  phone: string;
  occupation: string;
  website: string;
  dob: string | null;
  lookingFor: string;
  role: string;
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    showGender: boolean;
    showAddress: boolean;
    showInterests: boolean;
    showDOB: boolean;
  };
  createdAt: string;
  hasPassword: boolean;
}

const TABS: {
  key: Tab;
  label: string;
  icon: React.ElementType;
  title: string;
  description?: string;
}[] = [
  { key: "profile", label: "Edit profile", icon: Settings, title: "Edit profile" },
  { key: "posts", label: "My posts", icon: Newspaper, title: "My posts" },
  {
    key: "privacy",
    label: "Privacy",
    icon: Shield,
    title: "Privacy",
    description: "Choose what other people can see on your public profile.",
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: Bell,
    title: "Notifications",
    description: "Choose how DoonMeet lets you know about new activity.",
  },
  {
    key: "security",
    label: "Security",
    icon: KeyRound,
    title: "Security",
    description: "Manage your password and account.",
  },
];

export default function OwnProfileClient({ user }: { user: User }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [currentUser, setCurrentUser] = useState(user);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const joinedDate = new Date(currentUser.createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const active = TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-5 pb-8 sm:px-6 sm:pt-8">
      {/* Profile summary */}
      <header className="rounded-[24px] border border-border bg-surface p-5">
        <div className="flex items-center gap-4">
          <ProfileAvatar
            avatar={currentUser.avatar}
            name={currentUser.name}
            editable
            className="h-20 w-20 sm:h-24 sm:w-24"
            onUpdate={(url) => setCurrentUser((prev) => ({ ...prev, avatar: url }))}
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-extrabold sm:text-3xl">{currentUser.name}</h1>
            <p className="truncate text-[15px] text-muted">{currentUser.email}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
              {currentUser.address && (
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin size={14} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">{currentUser.address}</span>
                </span>
              )}
              <span>Joined {joinedDate}</span>
            </p>
          </div>
        </div>

        {currentUser.bio && (
          <p className="mt-3 text-[15px] leading-relaxed break-words">{currentUser.bio}</p>
        )}

        {currentUser.interests?.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {currentUser.interests.map((interest) => (
              <li
                key={interest}
                className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary-fg capitalize"
              >
                {interest}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
          <Link href={`/users/${currentUser._id}`} className={buttonClasses("secondary", "md")}>
            <ExternalLink size={17} aria-hidden="true" />
            View public profile
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-12 items-center justify-center gap-2 rounded-[14px] px-5 text-[15px] font-semibold text-danger transition-colors hover:bg-danger/10"
          >
            <LogOut size={17} aria-hidden="true" />
            Log out
          </button>
        </div>
      </header>

      {/* Section tabs — labelled pills that scroll sideways on phones
          (icon-only tabs were guesswork for users). */}
      <div className="-mx-4 mt-5 sm:mx-0">
        <div
          role="tablist"
          aria-label="Profile sections"
          className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive ? "bg-primary text-on-primary" : "bg-surface-2 text-text hover:bg-border"
                }`}
              >
                <Icon size={17} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <section
        role="tabpanel"
        aria-label={active.title}
        className="mt-4 rounded-[20px] border border-border bg-surface p-4 sm:p-6"
      >
        {active.description && (
          <div className="mb-4">
            <h2 className="text-lg font-extrabold">{active.title}</h2>
            <p className="mt-0.5 text-sm text-muted">{active.description}</p>
          </div>
        )}

        {activeTab === "profile" && (
          <EditProfileForm
            initialData={{
              name: currentUser.name,
              bio: currentUser.bio ?? "",
              gender: currentUser.gender ?? "",
              address: currentUser.address ?? "",
              interests: currentUser.interests ?? [],
              phone: currentUser.phone ?? "",
              occupation: currentUser.occupation ?? "",
              website: currentUser.website ?? "",
              dob: currentUser.dob ? currentUser.dob.split("T")[0] : "",
              lookingFor: currentUser.lookingFor ?? "",
            }}
            onSuccess={(updated) => setCurrentUser((prev) => ({ ...prev, ...updated }))}
          />
        )}

        {activeTab === "posts" && <MyPostsTab userId={currentUser._id} />}

        {activeTab === "privacy" && (
          <>
            <PrivacySettings initialPrivacy={currentUser.privacy} />
            <BlockedUsersList />
          </>
        )}

        {activeTab === "notifications" && <NotificationSettings />}

        {activeTab === "security" && (
          <>
            <ChangePasswordForm
              hasPassword={currentUser.hasPassword}
              onPasswordSet={() => setCurrentUser((prev) => ({ ...prev, hasPassword: true }))}
            />
            <DeleteAccountSection hasPassword={currentUser.hasPassword} />
          </>
        )}
      </section>
    </div>
  );
}

// Inline change / set password form
function ChangePasswordForm({
  hasPassword,
  onPasswordSet,
}: {
  hasPassword: boolean;
  onPasswordSet: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [touched, setTouched] = useState(false);

  const rules = [
    { label: "At least 8 characters", valid: form.newPassword.length >= 8 },
    { label: "One capital letter (A–Z)", valid: /[A-Z]/.test(form.newPassword) },
    { label: "One number (0–9)", valid: /[0-9]/.test(form.newPassword) },
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

      // First time a Google-only user sets a password — flip the parent's
      // hasPassword flag so this form immediately switches to "change
      // password" mode instead of still claiming Google-only until a refresh.
      if (!hasPassword) onPasswordSet();

      // Re-sync server-derived state (getSessionUser) in the background so
      // hasPassword never drifts from the real DB value on this page.
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h3 className="text-base font-bold">{hasPassword ? "Change password" : "Set a password"}</h3>
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {!hasPassword && (
        <Alert
          type="info"
          message="You signed up with Google. Set a password here to also log in with your email."
        />
      )}

      {hasPassword && (
        <PasswordInput
          label="Current password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          required
        />
      )}

      <div>
        <PasswordInput
          label={hasPassword ? "New password" : "Password"}
          autoComplete="new-password"
          value={form.newPassword}
          onChange={(e) => {
            setForm({ ...form, newPassword: e.target.value });
            setTouched(true);
          }}
          required
        />

        {/* Live requirements checklist */}
        {(touched || form.newPassword.length > 0) && (
          <ul className="mt-2 flex flex-col gap-1">
            {rules.map((rule) => (
              <li
                key={rule.label}
                className={`flex items-center gap-1.5 text-sm ${rule.valid ? "text-primary-fg" : "text-muted"}`}
              >
                {rule.valid ? (
                  <Check size={15} aria-hidden="true" />
                ) : (
                  <X size={15} aria-hidden="true" />
                )}
                {rule.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
        />
        {form.confirmPassword.length > 0 && (
          <p
            className={`mt-1.5 flex items-center gap-1.5 text-sm ${passwordsMatch ? "text-primary-fg" : "text-danger"}`}
          >
            {passwordsMatch ? (
              <Check size={15} aria-hidden="true" />
            ) : (
              <X size={15} aria-hidden="true" />
            )}
            {passwordsMatch ? "Passwords match" : "Passwords do not match"}
          </p>
        )}
      </div>

      <Button type="submit" loading={loading}>
        {hasPassword ? "Change password" : "Set password"}
      </Button>
    </form>
  );
}
