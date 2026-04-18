import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "./user";
import { relations } from "drizzle-orm";

export const SystemPromptTable = pgTable("system_prompts", {
  userId: varchar("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .primaryKey(),
  systemPrompt: text("system_prompt").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const systemPromptRelations = relations(
  SystemPromptTable,
  ({ one }) => ({
    user: one(user, {
      fields: [SystemPromptTable.userId],
      references: [user.id],
    }),
  }),
);
