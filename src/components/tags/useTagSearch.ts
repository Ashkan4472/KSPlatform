"use client";

import { useEffect, useState } from "react";

export type TagResult = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
};

/** Debounced tag search against /api/tags/search. */
export function useTagSearch(
  query: string,
  { skipEmpty = false }: { skipEmpty?: boolean } = {},
) {
  const [results, setResults] = useState<TagResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    let active = true;

    const handle = setTimeout(async () => {
      if (skipEmpty && q === "") {
        if (active) {
          setResults([]);
          setLoading(false);
        }
        return;
      }
      if (active) setLoading(true);
      try {
        const res = await fetch(
          `/api/tags/search?q=${encodeURIComponent(q)}`,
        );
        const data = await res.json();
        if (active) setResults(Array.isArray(data) ? data : []);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query, skipEmpty]);

  return { results, loading };
}
