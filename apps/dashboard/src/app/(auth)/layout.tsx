import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) return redirect("/");

  return children;
};

export default AuthLayout;
