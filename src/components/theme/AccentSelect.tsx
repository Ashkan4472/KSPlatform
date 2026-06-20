"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENTS, type AccentKey } from "@/lib/fonts";
import { updatePreferencesAction } from "@/actions/preferences";

export function AccentSelect({ initial }: { initial: AccentKey }) {
  const [accent, setAccent] = useState<AccentKey>(initial);

  // Apply immediately (no reload) by setting the attribute the CSS reads.
  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  function choose(key: AccentKey) {
    setAccent(key);
    void updatePreferencesAction({ accent: key });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ACCENTS.map((a) => (
        <button
          key={a.key}
          type="button"
          onClick={() => choose(a.key)}
          aria-label={a.label}
          title={a.label}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
            accent === a.key ? "border-foreground" : "border-transparent",
          )}
          style={{ background: a.swatch }}
        >
          {accent === a.key && (
            <Check className="h-4 w-4 text-white drop-shadow" />
          )}
        </button>
      ))}
    </div>
  );
}
