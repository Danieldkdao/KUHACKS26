import type { Metadata } from "next";
import { UserRoundPlus } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Sign Up | Chat Dashboard",
  description: "Create an account for the chat dashboard.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      icon={UserRoundPlus}
      eyebrow="Create Account"
      title="Start using the dashboard"
      description="Create your account to review conversation history, keep your assistant aligned, and manage everything from one polished control center."
    >
      <SignUpForm />
    </AuthShell>
  );
}
