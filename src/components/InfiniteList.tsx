"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { Page } from "@/lib/pagination";

function LoadingSkeleton() {
  return (
    <div className="rounded-lg border p-4" aria-hidden>
      <div className="animate-shimmer mb-3 h-3 w-1/3 rounded" />
      <div className="animate-shimmer mb-2 h-4 w-2/3 rounded" />
      <div className="animate-shimmer h-3 w-full rounded" />
    </div>
  );
}

type Props<T> = {
  initialItems: T[];
  initialCursor: string | null;
  loadMore: (cursor: string) => Promise<Page<T>>;
  renderItem: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
  className?: string;
  emptyState?: React.ReactNode;
};

export function InfiniteList<T>({
  initialItems,
  initialCursor,
  loadMore,
  renderItem,
  getKey,
  className,
  emptyState,
}: Props<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  const fetchMore = useCallback(async () => {
    if (busyRef.current || cursor === null) return;
    busyRef.current = true;
    setLoading(true);
    try {
      const page = await loadMore(cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, [cursor, loadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchMore]);

  if (items.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div className={className}>
      {items.map((item) => (
        <Fragment key={getKey(item)}>{renderItem(item)}</Fragment>
      ))}
      {loading && (
        <div className="mt-2">
          <LoadingSkeleton />
        </div>
      )}
      {cursor !== null && <div ref={sentinelRef} className="h-4" />}
    </div>
  );
}
