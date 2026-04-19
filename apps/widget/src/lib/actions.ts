"use server";

import { db } from "@repo/db";
import { user } from "@repo/db/schema";
import { eq } from "drizzle-orm";

export const getUserInformation = async (userId: string | null | undefined) => {
  const defaultReturnValue = { name: "Anonymous", image: null };
  if (!userId) {
    return defaultReturnValue;
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!existingUser) {
    return defaultReturnValue;
  }

  return {
    name: existingUser.name,
    image: existingUser.image,
  };
};
