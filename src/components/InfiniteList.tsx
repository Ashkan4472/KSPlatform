"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type Page<T> = { items: T[]; nextCursor: string | null };

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
      {cursor !== null && (
        <div
          ref={sentinelRef}
          className="flex h-12 items-center justify-center"
        >
          {loading && (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  );
}
