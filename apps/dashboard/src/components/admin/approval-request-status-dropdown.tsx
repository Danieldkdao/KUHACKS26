"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Clock3, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { updateApprovalRequestStatus } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ApprovalRequestStatus = "pending" | "approved" | "rejected";

const statusOptions: Array<{
  value: ApprovalRequestStatus;
  label: string;
  Icon: typeof Clock3;
  triggerClassName: string;
}> = [
  {
    value: "pending",
    label: "Pending",
    Icon: Clock3,
    triggerClassName:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  },
  {
    value: "approved",
    label: "Approved",
    Icon: Check,
    triggerClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
  {
    value: "rejected",
    label: "Rejected",
    Icon: X,
    triggerClassName:
      "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  },
];

const statusMap = Object.fromEntries(
  statusOptions.map((option) => [option.value, option]),
) as Record<ApprovalRequestStatus, (typeof statusOptions)[number]>;

type ApprovalRequestStatusDropdownProps = {
  approvalRequestId: string;
  initialStatus: ApprovalRequestStatus;
};

export function ApprovalRequestStatusDropdown({
  approvalRequestId,
  initialStatus,
}: ApprovalRequestStatusDropdownProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    initialStatus,
    (_currentStatus, nextStatus: ApprovalRequestStatus) => nextStatus,
  );

  const activeStatus = statusMap[optimisticStatus];

  const handleStatusChange = (nextStatus: ApprovalRequestStatus) => {
    if (nextStatus === optimisticStatus || isPending) {
      return;
    }

    startTransition(async () => {
      setOptimisticStatus(nextStatus);

      const response = await updateApprovalRequestStatus(
        approvalRequestId,
        nextStatus,
      );

      if (response.error) {
        toast.error(response.message);
        router.refresh();
        return;
      }

      toast.success(response.message);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-8 w-full justify-between gap-2 border px-3 text-left shadow-none",
            activeStatus.triggerClassName,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <activeStatus.Icon className="size-4" />
            )}
            <span className="capitalize">{activeStatus.label}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup
          value={optimisticStatus}
          onValueChange={(value) =>
            handleStatusChange(value as ApprovalRequestStatus)
          }
        >
          {statusOptions.map((statusOption) => (
            <DropdownMenuRadioItem
              key={statusOption.value}
              value={statusOption.value}
              disabled={isPending}
              className="capitalize"
            >
              <statusOption.Icon className="size-4" />
              {statusOption.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
