import { getDashboardStats } from "@/lib/chat-data";
import { DashboardSidebarNav } from "@/components/dashboard-sidebar-nav";
import { Bot, MessageSquare, Sparkles } from "lucide-react";
import { DashboardSidebarUserButton } from "@/components/dashboard-sidebar-user-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

type DashboardSidebarProps = {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
};

export const DashboardSidebar = async ({ user }: DashboardSidebarProps) => {
  const { chats, totalChats, totalMessages } = await getDashboardStats();

  return (
    <Sidebar className="border-r-0" collapsible="offcanvas">
      <SidebarHeader className="gap-0 border-b border-border/70 px-5 py-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Bot className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Chat Dashboard
              </p>
              <p className="text-xs text-muted-foreground">
                Browse every stored conversation
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/70 bg-background/80 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="size-4" />
                <span className="text-xs font-medium">Chats</span>
              </div>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {totalChats}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/80 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="size-4" />
                <span className="text-xs font-medium">Messages</span>
              </div>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {totalMessages}
              </p>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4 py-4">
        <DashboardSidebarNav chats={chats} />
      </SidebarContent>
      <SidebarFooter className="border-t border-border/70 px-4 py-4">
        <DashboardSidebarUserButton user={user} />
      </SidebarFooter>
    </Sidebar>
  );
};
