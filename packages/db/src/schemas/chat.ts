import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { MessageTable } from "./message";
import { user } from "./user";

export const ChatTable = pgTable("chats", {
  id: uuid().primaryKey().defaultRandom(),
  userId: varchar("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const chatRelations = relations(ChatTable, ({ one, many }) => ({
  one: one(user, {
    fields: [ChatTable.userId],
    references: [user.id],
  }),
  messages: many(MessageTable),
}));
