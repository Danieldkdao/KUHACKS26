"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@repo/auth/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { PasswordInput } from "@/components/ui/password-input";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import {
  signInSchema,
  type SignInFormValues,
} from "@/lib/auth-form-schema";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") ?? "/";
  const signUpHref =
    callbackURL === "/"
      ? "/sign-up"
      : `/sign-up?callbackURL=${encodeURIComponent(callbackURL)}`;

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root");

    const response = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      callbackURL,
      rememberMe: true,
    });

    if (response.error) {
      const message = getAuthErrorMessage(
        response.error,
        "We couldn't sign you in. Please check your details and try again."
      );

      setError("root", {
        message,
      });
      toast.error(message);
      return;
    }

    toast.success(
      `Welcome back${response.data.user.name ? `, ${response.data.user.name}` : ""}.`
    );
    router.push(response.data.url ?? callbackURL);
    router.refresh();
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="sign-in-email">Email address</FieldLabel>
          <FieldContent>
            <Input
              id="sign-in-email"
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
          <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
          <FieldContent>
            <PasswordInput
              id="sign-in-password"
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={errors.password ? true : undefined}
              {...register("password")}
            />
            <FieldDescription>
              Use the same email and password you registered with.
            </FieldDescription>
            <FieldError errors={[errors.password]} />
          </FieldContent>
        </Field>
      </FieldGroup>

      <FieldError errors={[errors.root]} />

      <Button className="w-full" type="submit" disabled={isSubmitting}>
        <LoadingSwap isLoading={isSubmitting}>Sign in</LoadingSwap>
      </Button>

      <p className="text-center text-sm leading-6 text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={signUpHref}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign up here
        </Link>
      </p>
    </form>
  );
}
