import type { Metadata } from "next";
import { LogIn } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In | Chat Dashboard",
  description: "Sign in to access the chat dashboard.",
};

export default function SignInPage() {
  return (
    <AuthShell
      icon={LogIn}
      eyebrow="Welcome Back"
      title="Sign in to your dashboard"
      description="Access your stored chats, manage the assistant prompt, and pick up where you left off with a clean, focused workspace."
    >
      <SignInForm />
    </AuthShell>
  );
}
