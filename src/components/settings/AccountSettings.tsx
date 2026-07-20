"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  changePasswordAction,
  toggleNotificationsAction,
  deleteAccountAction,
} from "@/actions/accountSettings";

export function AccountSettings({
  initialNotificationsEnabled,
}: {
  initialNotificationsEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(changePasswordAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    initialNotificationsEnabled,
  );
  const [notifPending, startNotifTransition] = useTransition();

  useEffect(() => {
    if (state.ok) {
      toast.success("Password changed");
      formRef.current?.reset();
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  function onToggleNotifications() {
    const next = !notificationsEnabled;
    startNotifTransition(async () => {
      const res = await toggleNotificationsAction(next);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setNotificationsEnabled(next);
      toast.success(next ? "Notifications enabled" : "Notifications disabled");
    });
  }

  return (
    <div className="space-y-8">
      <form ref={formRef} action={formAction} className="max-w-sm space-y-4">
        <h3 className="text-sm font-medium">Change password</h3>
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Changing…" : "Change password"}
        </Button>
      </form>

      <div className="flex max-w-sm items-center justify-between rounded-md border px-3 py-2">
        <div>
          <p className="text-sm font-medium">Notifications</p>
          <p className="text-xs text-muted-foreground">
            New posts and tweets on tags you subscribe to
          </p>
        </div>
        <Button
          variant={notificationsEnabled ? "secondary" : "outline"}
          size="sm"
          onClick={onToggleNotifications}
          disabled={notifPending}
        >
          {notificationsEnabled ? (
            <>
              <Bell className="mr-1.5 h-4 w-4" /> On
            </>
          ) : (
            <>
              <BellOff className="mr-1.5 h-4 w-4" /> Off
            </>
          )}
        </Button>
      </div>

      <div className="flex max-w-sm items-center justify-between rounded-md border border-destructive/40 px-3 py-2">
        <div>
          <p className="text-sm font-medium">Delete account</p>
          <p className="text-xs text-muted-foreground">
            Permanently removes your posts, tweets, comments, and data
          </p>
        </div>
        <ConfirmDialog
          title="Delete your account?"
          description="This permanently removes your account, posts, tweets, comments, likes, and subscriptions. This cannot be undone."
          confirmLabel="Delete account"
          onConfirm={async () => {
            await deleteAccountAction();
          }}
          trigger={
            <Button variant="outline" size="sm" className="text-destructive">
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
          }
        />
      </div>
    </div>
  );
}
