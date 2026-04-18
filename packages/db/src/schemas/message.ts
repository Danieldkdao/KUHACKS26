import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { ChatTable } from "./chat";
import { relations } from "drizzle-orm";
import { user } from "./user";

export const messageRoles = ["user", "assistant"] as const;
export type MessageRole = (typeof messageRoles)[number];
export const messageRoleEnum = pgEnum("message_roles", messageRoles);

export const MessageTable = pgTable("messages", {
  id: uuid().primaryKey().defaultRandom(),
  userId: varchar("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  chatId: uuid("chat_id")
    .references(() => ChatTable.id, { onDelete: "cascade" })
    .notNull(),
  role: messageRoleEnum("role").notNull(),
  message: varchar("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const messageRelations = relations(MessageTable, ({ one }) => ({
  userId: one(user, {
    fields: [MessageTable.userId],
    references: [user.id],
  }),
  chat: one(ChatTable, {
    fields: [MessageTable.chatId],
    references: [ChatTable.id],
  }),
}));
