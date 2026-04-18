"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@repo/auth/client";
import { ChevronUp, LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type DashboardSidebarUserButtonProps = {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export function DashboardSidebarUserButton({
  user,
}: DashboardSidebarUserButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const response = await authClient.signOut();

      if (response.error) {
        toast.error(response.error.message || "We couldn't sign you out.");
        return;
      }

      toast.success("Signed out successfully.");
      setOpen(false);
      router.push("/sign-in");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-auto rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-3"
              data-open={open ? true : undefined}
            >
              <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary/12 text-primary">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold">
                    {getInitials(user.name) || <UserRound className="size-4" />}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="block truncate text-xs text-sidebar-foreground/70">
                  {user.email}
                </span>
              </span>
              <ChevronUp
                className={`size-4 shrink-0 text-sidebar-foreground/70 transition-transform ${
                  open ? "rotate-0" : "rotate-180"
                }`}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </SidebarMenuItem>
      </SidebarMenu>

      <DropdownMenuContent
        side="top"
        align="end"
        sideOffset={8}
        alignOffset={10}
        className="w-64 rounded-xl p-2"
      >
        <DropdownMenuLabel className="rounded-lg px-3 py-2">
          <p className="truncate text-sm font-medium text-foreground">
            {user.name}
          </p>
          <p className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          className="rounded-lg px-3 py-2"
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
          variant="destructive"
        >
          <LogOut className="size-4" />
          <LoadingSwap isLoading={isSigningOut} className="justify-items-start">
            Sign out
          </LoadingSwap>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
