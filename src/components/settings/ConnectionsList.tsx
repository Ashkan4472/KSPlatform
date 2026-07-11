"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import {
  revokeExtensionConnectionAction,
  type ExtensionConnectionRow,
} from "@/actions/deviceAuth";

function ConnectionRow({ connection }: { connection: ExtensionConnectionRow }) {
  const [revoked, setRevoked] = useState(false);
  if (revoked) return null;

  async function onConfirm() {
    const res = await revokeExtensionConnectionAction(connection.id);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Connection revoked");
    setRevoked(true);
  }

  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{connection.label}</p>
        <p className="text-xs text-muted-foreground">
          Connected {formatDate(connection.createdAt)}
          {connection.lastUsedAt
            ? ` · last used ${formatDate(connection.lastUsedAt)}`
            : " · never used"}
        </p>
      </div>
      <ConfirmDialog
        title="Revoke this connection?"
        description={`"${connection.label}" will immediately lose access to your account.`}
        confirmLabel="Revoke"
        onConfirm={onConfirm}
        trigger={
          <Button variant="destructive" size="sm">
            Revoke
          </Button>
        }
      />
    </div>
  );
}

export function ConnectionsList({
  connections,
}: {
  connections: ExtensionConnectionRow[];
}) {
  if (connections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No extensions are connected to your account.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {connections.map((c) => (
        <ConnectionRow key={c.id} connection={c} />
      ))}
    </div>
  );
}
