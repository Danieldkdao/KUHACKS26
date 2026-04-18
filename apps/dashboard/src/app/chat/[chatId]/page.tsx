import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getChatById } from "@/lib/chat-data";
import { MarkdownRenderer } from "@/components/markdown-renderer";

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
        <CardContent>
          <div className="mb-4 flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <span>
              {chat.messages.length === 1
                ? "1 message"
                : `${chat.messages.length} messages`}
            </span>
            <span>Full transcript</span>
          </div>

          <div className="max-h-[calc(100svh-15rem)] space-y-4 overflow-y-auto pr-1">
            {chat.messages.length ? (
              chat.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl border px-4 py-3 shadow-xs ${
                      message.role === "user"
                        ? "border-primary/15 bg-primary text-primary-foreground"
                        : "border-border/70 bg-card text-card-foreground"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] opacity-80">
                      <span>{message.role}</span>
                      <span className="text-[10px] opacity-70">
                        {formatDateTime(message.createdAt)}
                      </span>
                    </div>
                    {message.role === "user" ? (
                      <p className="whitespace-pre-wrap wrap-break-word text-base leading-7">
                        {message.message}
                      </p>
                    ) : (
                      <MarkdownRenderer>{message.message}</MarkdownRenderer>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                This chat does not have any stored messages yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
