"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, MessageSquareText } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type ChatNavItem = {
  id: string;
  createdAt: Date;
  messageCount: number;
  latestMessage: string | null;
  lastMessageAt: Date;
};

type DashboardSidebarNavProps = {
  chats: ChatNavItem[];
};

const formatShortDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));

const getChatLabel = (chatId: string) => `Chat ${chatId.slice(0, 8)}`;

export const DashboardSidebarNav = ({
  chats,
}: DashboardSidebarNavProps) => {
  const pathname = usePathname();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SidebarGroup className="p-0">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                isActive={pathname === "/"}
                className="h-auto rounded-xl border border-transparent bg-background/70 px-3 py-3 hover:border-border"
              >
                <Link href="/">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Home className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">Overview</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      System prompt and chat metrics
                    </span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup className="mt-4 min-h-0 flex-1 p-0">
        <div className="mb-3 flex items-center justify-between px-1">
          <SidebarGroupLabel className="h-auto px-0 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Chats
          </SidebarGroupLabel>
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            {chats.length}
          </span>
        </div>

        <SidebarGroupContent className="min-h-0 flex-1">
          <SidebarMenu className="gap-2">
            {chats.length ? (
              chats.map((chat) => {
                const href = `/chat/${chat.id}`;
                const isActive = pathname === href;

                return (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      asChild
                      size="lg"
                      isActive={isActive}
                      className={cn(
                        "h-auto items-start rounded-xl border px-3 py-3",
                        isActive
                          ? "border-primary/20 bg-primary/8"
                          : "border-border/70 bg-card hover:bg-muted/50",
                      )}
                    >
                      <Link href={href}>
                        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <MessageSquareText className="size-4 text-primary" />
                              <p className="truncate text-sm font-medium text-foreground">
                                {getChatLabel(chat.id)}
                              </p>
                            </div>
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                              {chat.latestMessage ?? "No messages yet."}
                            </p>
                            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>{formatShortDate(chat.lastMessageAt)}</span>
                              <span>
                                {chat.messageCount === 1
                                  ? "1 message"
                                  : `${chat.messageCount} messages`}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                            {chat.messageCount}
                          </div>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-background/70 px-4 py-6 text-sm text-muted-foreground">
                No chats yet. Start a conversation in the widget to see it here.
              </div>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  );
};
