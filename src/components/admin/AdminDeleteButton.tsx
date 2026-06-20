"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  const [pending, startTransition] = useTransition();

  function onClick() {
    const label = name ? `${kind} "${name}"` : `this ${kind}`;
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    startTransition(async () => {
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
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={pending}
      aria-label={`Delete ${kind}`}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
