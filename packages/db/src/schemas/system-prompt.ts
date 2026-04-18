import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const SystemPromptTable = pgTable("system_prompts", {
  id: uuid().primaryKey().defaultRandom(),
  systemPrompt: text("system_prompt").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
