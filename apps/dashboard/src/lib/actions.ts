"use server";

import { auth } from "@repo/auth";
import { db } from "@repo/db";
import {
  ApprovalRequestStatus,
  ApprovalRequestTable,
  SystemPromptTable,
} from "@repo/db/schema";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

const getSession = async () => {
  return auth.api.getSession({ headers: await headers() });
};

const isAdmin = async () => {
  const session = await getSession();

  if (!session || session.user.role !== "admin") {
    return false;
  }

  return true;
};

export const upsertSystemPrompt = async (systemPrompt: string) => {
  try {
    const session = await getSession();
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

export const getApprovalRequests = async () => {
  if (!(await isAdmin())) {
    return [];
  }

  return db.query.ApprovalRequestTable.findMany({
    with: {
      user: true,
    },
    orderBy: desc(ApprovalRequestTable.createdAt),
  });
};

export const updateApprovalRequestStatus = async (
  id: string,
  newStatus: ApprovalRequestStatus,
) => {
  try {
    if (!(await isAdmin())) {
      return {
        error: true,
        message: "You are not authorized to update approval requests.",
      };
    }

    const [updatedApprovalRequest] = await db
      .update(ApprovalRequestTable)
      .set({
        status: newStatus,
      })
      .where(eq(ApprovalRequestTable.id, id))
      .returning();

    if (!updatedApprovalRequest)
      throw new Error("Failed to update approval request status.");

    return {
      error: false,
      message: "Approval request status updated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: "Failed to update approval request status.",
    };
  }
};
