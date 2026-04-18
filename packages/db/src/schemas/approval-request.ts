import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./user";
import { relations } from "drizzle-orm";

export const approvalRequestStatuses = [
  "pending",
  "approved",
  "rejected",
] as const;
export type ApprovalRequestStatus = (typeof approvalRequestStatuses)[number];
export const approvalRequestStatusEnum = pgEnum(
  "approval_request_statuses",
  approvalRequestStatuses,
);

export const ApprovalRequestTable = pgTable("approval_requests", {
  id: uuid().primaryKey().defaultRandom(),
  userId: varchar("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  destination: varchar("destination").notNull(),
  cost: integer("cost").notNull(),
  status: approvalRequestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const approvalRequestRelations = relations(
  ApprovalRequestTable,
  ({ one }) => ({
    user: one(user, {
      fields: [ApprovalRequestTable.userId],
      references: [user.id],
    }),
  }),
);
