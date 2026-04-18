import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { MessageTable } from "./message";

export const ChatTable = pgTable("chats", {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const chatRelations = relations(ChatTable, ({ many }) => ({
  messages: many(MessageTable),
}));
