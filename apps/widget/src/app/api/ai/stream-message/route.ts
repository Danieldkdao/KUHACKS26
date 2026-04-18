import {
  UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from "ai";
import { db } from "@repo/db";
import { ChatTable, MessageTable } from "@repo/db/schema";
import { google } from "@repo/ai/models";

export async function POST(req: Request) {
  const { messages, chatId }: { messages: UIMessage[]; chatId: string | null } =
    await req.json();
  const latestUserMessage = messages
    .filter((msg) => msg.role === "user")
    .at(-1)
    ?.parts.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  if (!latestUserMessage?.trim()) {
    return new Response("Message is required", { status: 400 });
  }

  let chatIdToUse = chatId;
  if (!chatIdToUse) {
    const [insertedChat] = await db.insert(ChatTable).values({}).returning();
    chatIdToUse = insertedChat.id;
  }
  await db.insert(MessageTable).values({
    chatId: chatIdToUse,
    message: latestUserMessage,
    role: "user",
  });

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({
        type: "data-chatId",
        data: { chatId: chatIdToUse },
      });

      const result = streamText({
        model: google("gemini-2.5-flash-lite"),
        messages: await convertToModelMessages(messages),
        system: "You are a helpful assistant.",
        onFinish: async (data) => {
          const latestAIMessage = data.text;
          if (!latestAIMessage.trim()) return;

          await db.insert(MessageTable).values({
            chatId: chatIdToUse,
            message: latestAIMessage,
            role: "assistant",
          });
        },
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
}
