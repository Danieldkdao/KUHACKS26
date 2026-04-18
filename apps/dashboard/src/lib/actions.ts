"use server";

import { auth } from "@repo/auth";
import { db } from "@repo/db";
import { SystemPromptTable } from "@repo/db/schema";
import { headers } from "next/headers";

export const createUpdateSystemPrompt = async (systemPrompt: string) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return {
        error: true,
        message: "You are unauthenticated.",
      };

    await db
      .insert(SystemPromptTable)
      .values({
        userId: session.user.id,
        systemPrompt,
      })
      .onConflictDoUpdate({
        set: {
          systemPrompt,
        },
        target: SystemPromptTable.userId,
      });

    return {
      error: false,
      message: "System prompt saved successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: "Failed to create system ",
    };
  }
};
