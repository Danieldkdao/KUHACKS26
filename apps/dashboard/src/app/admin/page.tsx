import { auth } from "@repo/auth";
import { getApprovalRequests } from "@/lib/actions";
import { ApprovalRequestsTable } from "@/components/admin/approval-requests-table";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

const AdminPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return redirect("/");

  const approvalRequests = await getApprovalRequests();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3">
        <Link className="text-sm font-medium text-primary" href="/">
          Back to Dashboard
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Manage Approval Requests
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Review every traveler approval request, filter the queue, and update
            statuses directly from one admin-only workspace.
          </p>
        </div>
      </div>

      <ApprovalRequestsTable
        approvalRequests={approvalRequests.map((approvalRequest) => ({
          id: approvalRequest.id,
          userName: approvalRequest.user.name,
          userEmail: approvalRequest.user.email,
          status: approvalRequest.status,
          location: approvalRequest.destination,
          cost: approvalRequest.cost,
        }))}
      />
    </div>
  );
};

export default AdminPage;
