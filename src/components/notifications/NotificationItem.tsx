"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { markNotificationReadAction } from "@/actions/notifications";

type Props = {
  id: string;
  read: boolean;
  createdAt: Date;
  tagName: string;
  kind: "post" | "tweet";
  title: string;
  href: string;
};

export function NotificationItem({
  id,
  read,
  createdAt,
  tagName,
  kind,
  title,
  href,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      if (!read) await markNotificationReadAction(id);
      router.push(href);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition-colors hover:bg-accent",
        !read && "border-foreground/20 bg-muted/40",
      )}
    >
      {!read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
      <div className={cn("flex-1", read && "pl-5")}>
        <p className="text-sm">
          New {kind} in <span className="font-medium">#{tagName}</span>:{" "}
          <span className="font-medium">{title}</span>
        </p>
        <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
      </div>
    </button>
  );
}
