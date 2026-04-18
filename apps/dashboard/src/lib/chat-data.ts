import { db } from "@repo/db";

export const getSystemPrompt = async () => {
  return db.query.SystemPromptTable.findFirst({});
};

export const getChats = async () => {
  const chats = await db.query.ChatTable.findMany({
    columns: {
      id: true,
      createdAt: true,
    },
    with: {
      messages: {
        columns: {
          id: true,
          role: true,
          message: true,
          createdAt: true,
        },
        orderBy: (messages, { desc }) => [desc(messages.createdAt)],
      },
    },
  });

  return chats
    .map((chat) => ({
      id: chat.id,
      createdAt: chat.createdAt,
      messageCount: chat.messages.length,
      latestMessage: chat.messages[0]?.message ?? null,
      lastMessageAt: chat.messages[0]?.createdAt ?? chat.createdAt,
    }))
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );
};

export const getChatById = async (chatId: string) => {
  return db.query.ChatTable.findFirst({
    where: (chats, { eq }) => eq(chats.id, chatId),
    columns: {
      id: true,
      createdAt: true,
    },
    with: {
      messages: {
        columns: {
          id: true,
          role: true,
          message: true,
          createdAt: true,
        },
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
    },
  });
};

export const getDashboardStats = async () => {
  const chats = await getChats();

  const totalMessages = chats.reduce((sum, chat) => sum + chat.messageCount, 0);
  const activeToday = chats.filter((chat) => {
    const now = Date.now();
    const lastMessageAt = new Date(chat.lastMessageAt).getTime();

    return now - lastMessageAt < 1000 * 60 * 60 * 24;
  }).length;

  return {
    chats,
    totalChats: chats.length,
    totalMessages,
    activeToday,
  };
};
