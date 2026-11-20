import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Forgot Password", "Reset your DoonMeet account password.");

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
