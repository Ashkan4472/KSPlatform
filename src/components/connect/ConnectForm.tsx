"use client";

import { useActionState } from "react";
import { approveDeviceCodeAction } from "@/actions/deviceAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ConnectForm({ initialCode }: { initialCode: string }) {
  const [state, formAction, pending] = useActionState(
    approveDeviceCodeAction,
    {},
  );

  if (state?.ok) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Extension connected</CardTitle>
          <CardDescription>
            You can close this tab and return to your browser&apos;s new tab
            page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Connect your extension</CardTitle>
        <CardDescription>
          Enter the code shown in the browser extension to approve its
          access to your account. Your password is never shared with it.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userCode">Connection code</Label>
            <Input
              id="userCode"
              name="userCode"
              placeholder="WXYZ-1234"
              defaultValue={initialCode}
              autoComplete="off"
              autoCapitalize="characters"
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Approving…" : "Approve"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
