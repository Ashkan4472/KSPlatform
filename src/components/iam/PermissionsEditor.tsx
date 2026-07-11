"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { GRANTABLE_PERMISSIONS, PERMISSION_LABELS } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";
import {
  searchUsersForIamAction,
  getUserPermissionsAction,
  grantPermissionAction,
  revokePermissionAction,
  type IamUserRow,
} from "@/actions/iam";
import type { EffectivePermission } from "@/lib/session";

export function PermissionsEditor() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IamUserRow[]>([]);
  const [selected, setSelected] = useState<IamUserRow | null>(null);
  const [permissions, setPermissions] = useState<EffectivePermission[]>([]);
  const [pending, setPending] = useState<Permission | null>(null);

  useEffect(() => {
    const q = query.trim();
    let active = true;
    const handle = setTimeout(async () => {
      if (!q) {
        if (active) setResults([]);
        return;
      }
      const rows = await searchUsersForIamAction(q);
      if (active) setResults(rows);
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query]);

  async function selectUser(user: IamUserRow) {
    setSelected(user);
    setResults([]);
    setQuery("");
    const rows = await getUserPermissionsAction(user.id);
    setPermissions(rows);
  }

  async function refreshSelected() {
    if (!selected) return;
    const rows = await getUserPermissionsAction(selected.id);
    setPermissions(rows);
  }

  async function toggle(permission: Permission, held: boolean) {
    if (!selected) return;
    setPending(permission);
    const res = held
      ? await revokePermissionAction(selected.id, permission)
      : await grantPermissionAction(selected.id, permission);
    setPending(null);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(held ? "Permission revoked" : "Permission granted");
    await refreshSelected();
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Input
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 && (
          <Card className="absolute z-10 mt-1 w-full py-1">
            <CardContent className="flex flex-col p-0">
              {results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => selectUser(u)}
                  className="flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span>
                    {u.name}{" "}
                    <span className="text-muted-foreground">{u.email}</span>
                  </span>
                  {u.role === "ADMIN" && (
                    <Badge variant="outline">Admin</Badge>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {selected && (
        <Card>
          <CardContent className="space-y-1 pt-4">
            <div className="mb-3 flex items-center gap-2">
              <p className="font-medium">{selected.name}</p>
              <span className="text-sm text-muted-foreground">
                {selected.email}
              </span>
              {selected.role === "ADMIN" && (
                <Badge variant="outline">Admin</Badge>
              )}
            </div>

            {selected.role === "ADMIN" ? (
              <p className="text-sm text-muted-foreground">
                This account is an admin — it holds every permission by
                role, not by individual grant.
              </p>
            ) : (
              <div className="divide-y">
                {GRANTABLE_PERMISSIONS.map((permission) => {
                  const held = permissions.find(
                    (p) => p.permission === permission,
                  );
                  return (
                    <div
                      key={permission}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {PERMISSION_LABELS[permission]}
                        </p>
                        {held && (
                          <p className="text-xs text-muted-foreground">
                            Granted by {held.grantedBy?.name}
                            {held.grantedAt
                              ? ` on ${formatDate(held.grantedAt)}`
                              : ""}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={held ? "default" : "outline"}
                        disabled={pending === permission}
                        onClick={() => toggle(permission, !!held)}
                      >
                        {held ? "Granted" : "Grant"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
