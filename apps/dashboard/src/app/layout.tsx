import type { Metadata } from "next";
import { Outfit, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const outfitSans = Outfit({
  variable: "--font-outfit-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat Dashboard",
  description: "Chat Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        outfitSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Script
          src="http://localhost:3001/widget.js"
          strategy="afterInteractive"
          data-widget-id="local-dev"
          data-position="bottom-right"
          data-theme="light"
        />
        <Toaster />
        <SidebarProvider defaultOpen>
          <DashboardSidebar />
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
      </body>
    </html>
  );
}
