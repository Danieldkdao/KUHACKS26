import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthShellProps = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <div className="w-full min-h-dvh py-10 px-6 flex items-center justify-center">
      <div className="w-full max-w-150">
        <Card className="border-border/70 bg-card/95 shadow-xl shadow-primary/5">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/10">
                <Icon className="size-5" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {eyebrow}
                </p>
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  {title}
                </CardTitle>
                <CardDescription className="max-w-xl text-sm leading-6">
                  {description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
