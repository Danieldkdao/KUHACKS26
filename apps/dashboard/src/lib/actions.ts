"use server";

import { db } from "@repo/db";
import { SystemPromptTable } from "@repo/db/schema";

export const createUpdateSystemPrompt = async (systemPrompt: string) => {
  try {
    const [existingSystemPrompt] = await db.select().from(SystemPromptTable);

    if (!existingSystemPrompt) {
      await db.insert(SystemPromptTable).values({
        systemPrompt,
      });
    } else {
      await db.update(SystemPromptTable).set({
        systemPrompt,
      });
    }

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
