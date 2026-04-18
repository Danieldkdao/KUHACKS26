import Link from "next/link";
import { ArrowRight, Clock3, MessageSquareText, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SystemPromptForm } from "@/components/system-prompt-form";
import { getDashboardStats, getSystemPrompt } from "@/lib/chat-data";

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

export default async function Page() {
  const [{ chats, totalChats, totalMessages, activeToday }, systemPrompt] =
    await Promise.all([getDashboardStats(), getSystemPrompt()]);

  const recentChats = chats.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3">
        <p className="text-sm font-medium text-primary">Dashboard Overview</p>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Manage conversations and your assistant prompt
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Review recent chat activity from the widget, inspect full
            transcripts, and keep the assistant aligned by updating the system
            prompt from one place.
          </p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 shadow-sm">
          <CardContent>
            <div className="flex items-center gap-3 text-muted-foreground">
              <MessageSquareText className="size-4 text-primary" />
              <span className="text-sm font-medium">Total Chats</span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-foreground">
              {totalChats}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-medium">Total Messages</span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-foreground">
              {totalMessages}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock3 className="size-4 text-primary" />
              <span className="text-sm font-medium">Active Today</span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-foreground">
              {activeToday}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <SystemPromptForm initialValue={systemPrompt?.systemPrompt ?? ""} />

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Chats</CardTitle>
            <CardDescription>
              Jump back into the latest conversations from the widget.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentChats.length ? (
              recentChats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className="block rounded-xl border border-border/70 bg-background/80 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        Chat {chat.id.slice(0, 8)}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {chat.latestMessage ?? "No messages yet."}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{chat.messageCount} messages</span>
                    <span>{formatDateTime(chat.lastMessageAt)}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No chats have been created yet.
              </div>
            )}

            {chats[0] ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/chat/${chats[0].id}`}>Open Latest Chat</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
