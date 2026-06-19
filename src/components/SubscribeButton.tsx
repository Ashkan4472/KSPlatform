"use client";

import { useState, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleSubscriptionAction } from "@/actions/subscriptions";

export function SubscribeButton({
  tagId,
  initialSubscribed,
}: {
  tagId: string;
  initialSubscribed: boolean;
}) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [pending, startTransition] = useTransition();

  function onToggle() {
    startTransition(async () => {
      const res = await toggleSubscriptionAction(tagId);
      setSubscribed(res.subscribed);
    });
  }

  return (
    <Button
      variant={subscribed ? "secondary" : "outline"}
      size="sm"
      onClick={onToggle}
      disabled={pending}
    >
      {subscribed ? (
        <>
          <Check className="mr-1.5 h-4 w-4" /> Subscribed
        </>
      ) : (
        <>
          <Plus className="mr-1.5 h-4 w-4" /> Subscribe
        </>
      )}
    </Button>
  );
}
