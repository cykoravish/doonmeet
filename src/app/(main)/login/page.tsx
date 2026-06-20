import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Log In | DoonMeet",
  description: "Log in to DoonMeet and reconnect with Dehradun.",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[1fr_480px]">
      <AuthBrandPanel />
      <div
        className="flex items-center justify-center px-8 py-12"
        style={{ backgroundColor: "rgb(var(--background))" }}
      >
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}