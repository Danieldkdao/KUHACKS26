import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { getServerSession } from "@/lib/auth-session";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import Script from "next/script";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <>
      <Script
        src="http://localhost:3001/widget.js"
        strategy="afterInteractive"
        data-widget-id="local-dev"
        data-position="bottom-right"
        data-theme="light"
      />
      <SidebarProvider defaultOpen>
        <DashboardSidebar user={session.user} />
        <SidebarInset className="bg-muted/30">
          <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur md:hidden">
            <SidebarTrigger />
            <div>
              <p className="text-sm font-medium text-foreground">
                Chat Dashboard
              </p>
            </div>
          </div>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
