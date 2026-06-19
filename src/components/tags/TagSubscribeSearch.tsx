"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SubscribeButton } from "@/components/SubscribeButton";
import { useTagSearch } from "@/components/tags/useTagSearch";

export function TagSubscribeSearch({
  subscribedIds,
}: {
  subscribedIds: string[];
}) {
  const [q, setQ] = useState("");
  const { results, loading } = useTagSearch(q);
  const subscribed = new Set(subscribedIds);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tags to subscribe…"
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {results.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">
            {q ? "No matching tags." : "No tags yet."}
          </p>
        )}
        {results.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Badge variant="secondary">#{t.name}</Badge>
              <span className="text-xs text-muted-foreground">
                {t.postCount} post{t.postCount === 1 ? "" : "s"}
              </span>
            </div>
            <SubscribeButton
              tagId={t.id}
              initialSubscribed={subscribed.has(t.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
