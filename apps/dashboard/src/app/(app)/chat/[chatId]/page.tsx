import { notFound } from "next/navigation";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getChatById } from "@/lib/chat-data";
import { ChatIdView } from "@/components/chat-id-view";

type ChatPageProps = {
  params: Promise<{
    chatId: string;
  }>;
};

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params;
  const chat = await getChatById(chatId);

  if (!chat) notFound();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Chat {chat.id.slice(0, 8)}</CardTitle>
          <CardDescription>
            Created {formatDateTime(chat.createdAt)}. Scroll through the full
            message history below.
          </CardDescription>
        </CardHeader>
        <ChatIdView initialChatId={chat.id} messagesOg={chat.messages} />
      </Card>
    </div>
  );
}
