import { requireUserId } from "@/lib/session";
import { listExtensionConnectionsAction } from "@/actions/deviceAuth";
import { ConnectionsList } from "@/components/settings/ConnectionsList";

export default async function ConnectionsPage() {
  await requireUserId("/settings/connections");
  const connections = await listExtensionConnectionsAction();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Connected extensions</h1>
        <p className="text-sm text-muted-foreground">
          Browser extensions that can read your subscribed-tags feed.
        </p>
      </div>
      <ConnectionsList connections={connections} />
    </div>
  );
}
