import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata(
  "Log In",
  "Log in to DoonMeet and reconnect with Dehradun."
);

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
