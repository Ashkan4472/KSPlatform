"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SIZES, type SizeKey } from "@/lib/fonts";
import { updatePreferencesAction } from "@/actions/preferences";

export function SizeSelect({ initial }: { initial: SizeKey }) {
  const [size, setSize] = useState<SizeKey>(initial);

  // Apply immediately (no reload) by setting the attribute the CSS reads.
  useEffect(() => {
    document.documentElement.dataset.size = size;
  }, [size]);

  function choose(key: SizeKey) {
    setSize(key);
    void updatePreferencesAction({ size: key });
  }

  return (
    <div className="inline-flex rounded-md border p-0.5">
      {SIZES.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => choose(s.key)}
          className={cn(
            "rounded-sm px-3 py-1 text-sm transition-colors",
            size === s.key
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
