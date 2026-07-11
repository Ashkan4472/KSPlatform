import { useCallback, useEffect, useRef, useState } from "react";
import browser from "webextension-polyfill";
import { fetchFeed, getStoredToken, type FeedResult } from "../lib/api";
import type { FeedItem as FeedItemData } from "../lib/types";
import { FeedItem } from "./FeedItem";

type ViewState =
  | { kind: "loading" }
  | { kind: "connect" }
  | { kind: "offline" }
  | { kind: "feed"; items: FeedItemData[]; nextCursor: string | null };

export function App() {
  const [view, setView] = useState<ViewState>({ kind: "loading" });
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const token = await getStoredToken();
    if (!token) {
      setView({ kind: "connect" });
      return;
    }
    const result: FeedResult = await fetchFeed();
    if (result.status === "reauthenticate") {
      setView({ kind: "connect" });
    } else if (result.status === "offline") {
      setView({ kind: "offline" });
    } else {
      setView({
        kind: "feed",
        items: result.page.items,
        nextCursor: result.page.nextCursor,
      });
    }
  }, []);

  useEffect(() => {
    void load();
    function onMessage(message: unknown) {
      const msg = message as { type?: string; status?: string };
      if (msg?.type === "connect-result" && msg.status === "connected") {
        void load();
      }
    }
    browser.runtime.onMessage.addListener(onMessage);
    return () => browser.runtime.onMessage.removeListener(onMessage);
  }, [load]);

  const loadMore = useCallback(async () => {
    if (view.kind !== "feed" || !view.nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchFeed(view.nextCursor);
      if (result.status === "ok") {
        setView((prev) =>
          prev.kind === "feed"
            ? {
                kind: "feed",
                items: [...prev.items, ...result.page.items],
                nextCursor: result.page.nextCursor,
              }
            : prev,
        );
      } else if (result.status === "reauthenticate") {
        setView({ kind: "connect" });
      }
    } finally {
      setLoadingMore(false);
    }
  }, [view, loadingMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || view.kind !== "feed" || !view.nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [view, loadMore]);

  function startConnect() {
    void browser.runtime.sendMessage({ type: "start-connect" });
  }

  if (view.kind === "loading") {
    return <main className="state-message">Loading…</main>;
  }

  if (view.kind === "connect") {
    return (
      <main className="state-message">
        <h1>Connect your KSPlatform account</h1>
        <p>See posts and tweets from your subscribed tags on every new tab.</p>
        <button onClick={startConnect}>Connect account</button>
      </main>
    );
  }

  if (view.kind === "offline") {
    return (
      <main className="state-message">
        <h1>You&apos;re offline</h1>
        <button onClick={() => void load()}>Retry</button>
      </main>
    );
  }

  if (view.items.length === 0) {
    return (
      <main className="state-message">
        <h1>No feed items yet</h1>
        <p>Subscribe to tags on KSPlatform to see their posts and tweets here.</p>
      </main>
    );
  }

  return (
    <main className="feed">
      {view.items.map((item) => (
        <FeedItem
          key={item.kind === "post" ? item.post.id : item.tweet.id}
          item={item}
        />
      ))}
      {view.nextCursor && <div ref={sentinelRef} className="feed-sentinel" />}
    </main>
  );
}
