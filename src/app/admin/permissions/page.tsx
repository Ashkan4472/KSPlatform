import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { PermissionsEditor } from "@/components/iam/PermissionsEditor";

export default async function AdminPermissionsPage() {
  await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-12">
      <div>
        <Link
          href="/admin"
          className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to admin
        </Link>
        <h1 className="text-2xl font-semibold">Permissions</h1>
        <p className="text-sm text-muted-foreground">
          Search a user to grant or revoke a specific capability without
          making them a full admin.
        </p>
      </div>
      <PermissionsEditor />
    </div>
  );
}
