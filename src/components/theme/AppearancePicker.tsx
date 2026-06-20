"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { updatePreferencesAction } from "@/actions/preferences";

type PrefKey = "surface" | "radius" | "cardStyle" | "borderDensity" | "shadow";

function persist(prefKey: PrefKey, key: string) {
  switch (prefKey) {
    case "surface":
      return updatePreferencesAction({ surface: key });
    case "radius":
      return updatePreferencesAction({ radius: key });
    case "cardStyle":
      return updatePreferencesAction({ cardStyle: key });
    case "borderDensity":
      return updatePreferencesAction({ borderDensity: key });
    case "shadow":
      return updatePreferencesAction({ shadow: key });
  }
}

/**
 * Generic segmented appearance control. Sets a `data-{attr}` attribute on
 * <html> immediately and persists the choice via the preferences action.
 */
export function AppearancePicker({
  attr,
  prefKey,
  options,
  initial,
}: {
  attr: string;
  prefKey: PrefKey;
  options: readonly { key: string; label: string; swatch?: string }[];
  initial: string;
}) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    document.documentElement.dataset[attr] = value;
  }, [attr, value]);

  function choose(key: string) {
    setValue(key);
    void persist(prefKey, key);
  }

  return (
    <div className="inline-flex flex-wrap gap-0.5 rounded-md border p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => choose(o.key)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-sm transition-colors",
            value === o.key
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.swatch && (
            <span
              className="h-3 w-3 rounded-full border"
              style={{ background: o.swatch }}
            />
          )}
          {o.label}
        </button>
      ))}
    </div>
  );
}
