"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ApprovalRequestStatusDropdown,
  type ApprovalRequestStatus,
} from "@/components/admin/approval-request-status-dropdown";

type ApprovalRequestRow = {
  id: string;
  userName: string;
  userEmail: string;
  status: ApprovalRequestStatus;
  location: string;
  cost: number;
};

type ApprovalRequestsTableProps = {
  approvalRequests: ApprovalRequestRow[];
};

const statusFilterOptions: Array<{
  value: ApprovalRequestStatus | "all";
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function SortableHeader({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn("-ml-3 h-8 gap-2 px-3 text-foreground", className)}
      onClick={onClick}
    >
      <span>{label}</span>
      <ArrowUpDown className="size-4 opacity-70" />
    </Button>
  );
}

export function ApprovalRequestsTable({
  approvalRequests,
}: ApprovalRequestsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "cost", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 8,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApprovalRequestStatus | "all">(
    "all",
  );

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return approvalRequests.filter((approvalRequest) => {
      const matchesStatus =
        statusFilter === "all" || approvalRequest.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        approvalRequest.userName.toLowerCase().includes(normalizedSearch) ||
        approvalRequest.location.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [approvalRequests, searchQuery, statusFilter]);

  useEffect(() => {
    setPagination((current) => ({
      ...current,
      pageIndex: 0,
    }));
  }, [searchQuery, statusFilter]);

  const columns = useMemo<ColumnDef<ApprovalRequestRow>[]>(
    () => [
      {
        accessorKey: "userName",
        header: ({ column }) => (
          <SortableHeader
            label="User"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {row.original.userName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.userEmail}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <SortableHeader
            label="Status"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <ApprovalRequestStatusDropdown
            approvalRequestId={row.original.id}
            initialStatus={row.original.status}
          />
        ),
      },
      {
        accessorKey: "location",
        header: ({ column }) => (
          <SortableHeader
            label="Location"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.location}
          </span>
        ),
      },
      {
        accessorKey: "cost",
        header: ({ column }) => (
          <SortableHeader
            label="Cost"
            className="ml-auto"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <div className="text-right font-medium text-foreground">
            {currencyFormatter.format(row.original.cost)}
          </div>
        ),
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredRequests,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedStatusFilterLabel =
    statusFilterOptions.find((option) => option.value === statusFilter)?.label ??
    "All statuses";

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Approval Requests</CardTitle>
            <CardDescription>
              Review requests, search by traveler or destination, and update
              statuses without leaving the table.
            </CardDescription>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(18rem,24rem)_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by user or location..."
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="justify-between gap-2"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="size-4" />
                    {selectedStatusFilterLabel}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuRadioGroup
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as ApprovalRequestStatus | "all")
                  }
                >
                  {statusFilterOptions.map((option) => (
                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                      <span className={cn(option.value !== "all" && "capitalize")}>
                        {option.label}
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/70 bg-background">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        header.column.id === "cost" && "text-right",
                        header.column.id === "status" && "w-[12rem]",
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.id === "cost" && "text-right",
                          cell.column.id === "userName" && "max-w-[18rem]",
                          cell.column.id === "location" && "max-w-[16rem]",
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-sm text-muted-foreground"
                  >
                    No approval requests match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            Showing{" "}
            <span className="font-medium text-foreground">
              {table.getRowModel().rows.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {filteredRequests.length}
            </span>{" "}
            filtered requests
          </p>

          <div className="flex items-center gap-2 self-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="min-w-24 text-center">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {Math.max(table.getPageCount(), 1)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
