"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  adminDeletePost,
  adminDeleteTweet,
  adminDeleteUser,
} from "@/actions/admin";

type Kind = "post" | "tweet" | "user";

export function AdminDeleteButton({
  kind,
  id,
  name,
}: {
  kind: Kind;
  id: string;
  name?: string;
}) {
  const router = useRouter();

  async function onConfirm() {
    const res =
      kind === "post"
        ? await adminDeletePost(id)
        : kind === "tweet"
          ? await adminDeleteTweet(id)
          : await adminDeleteUser(id);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(`Deleted ${kind}`);
    router.refresh();
  }

  return (
    <ConfirmDialog
      title={`Delete ${kind}?`}
      description={
        name
          ? `"${name}" will be permanently removed. This cannot be undone.`
          : `This ${kind} will be permanently removed. This cannot be undone.`
      }
      onConfirm={onConfirm}
      trigger={
        <Button variant="ghost" size="icon" aria-label={`Delete ${kind}`}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      }
    />
  );
}
