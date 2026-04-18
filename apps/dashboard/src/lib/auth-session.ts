import { auth } from "@repo/auth";
import { headers } from "next/headers";

export async function getServerSession() {
  const requestHeaders = await headers();

  return auth.api.getSession({
    headers: requestHeaders,
  });
}
