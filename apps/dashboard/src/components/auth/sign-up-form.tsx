"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/ui/password-strength";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { signUpSchema, type SignUpFormValues } from "@/lib/auth-form-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") ?? "/";
  const signInHref =
    callbackURL === "/"
      ? "/sign-in"
      : `/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`;

  const {
    control,
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const [name, email, password] = useWatch({
    control,
    name: ["name", "email", "password"],
  });

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root");

    const response = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL,
    });

    if (response.error) {
      const message = getAuthErrorMessage(
        response.error,
        "We couldn't create your account right now. Please try again.",
      );

      setError("root", {
        message,
      });
      toast.error(message);
      return;
    }

    toast.success(
      `Welcome, ${response.data.user.name}. Your account is ready.`,
    );
    router.push(callbackURL);
    router.refresh();
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="sign-up-name">Full name</FieldLabel>
          <FieldContent>
            <Input
              id="sign-up-name"
              autoComplete="name"
              placeholder="Jane Doe"
              aria-invalid={errors.name ? true : undefined}
              {...register("name")}
            />
            <FieldError errors={[errors.name]} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="sign-up-email">Email address</FieldLabel>
          <FieldContent>
            <Input
              id="sign-up-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={errors.email ? true : undefined}
              {...register("email")}
            />
            <FieldError errors={[errors.email]} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
          <FieldContent>
            <PasswordInput
              id="sign-up-password"
              autoComplete="new-password"
              placeholder="Create a secure password"
              aria-invalid={errors.password ? true : undefined}
              {...register("password")}
            />
            <PasswordStrength
              password={password}
              userInputs={[name, email].filter(Boolean)}
            />

            <FieldError errors={[errors.password]} />
          </FieldContent>
        </Field>
      </FieldGroup>

      <FieldError errors={[errors.root]} />

      <Button className="w-full" type="submit" disabled={isSubmitting}>
        <LoadingSwap isLoading={isSubmitting}>Create account</LoadingSwap>
      </Button>

      <p className="text-center text-sm leading-6 text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={signInHref}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in here
        </Link>
      </p>
    </form>
  );
}
