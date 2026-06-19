"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { slugify } from "@/lib/slug";
import { useTagSearch } from "@/components/tags/useTagSearch";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
};

export function TagAutocomplete({ value, onChange, max = 8 }: Props) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { results } = useTagSearch(draft, { skipEmpty: true });

  const draftSlug = slugify(draft);

  function addTag(raw: string) {
    const name = slugify(raw);
    if (!name) return;
    if (value.includes(name)) {
      setDraft("");
      return;
    }
    if (value.length >= max) return;
    onChange([...value, name]);
    setDraft("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (draftSlug) addTag(draftSlug);
    } else if (e.key === "Backspace" && draft === "" && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  // Suggestions not already selected.
  const suggestions = results.filter((r) => !value.includes(r.name));
  const exactExists = results.some((r) => r.name === draftSlug);
  const showCreate = draftSlug.length > 0 && !exactExists && !value.includes(draftSlug);

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2 rounded-md border p-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(value.filter((x) => x !== tag))}
              className="rounded-full hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
          placeholder={value.length ? "" : "Search or create tags…"}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open && (suggestions.length > 0 || showCreate) && (
        <ul
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
          onMouseDown={(e) => {
            // keep focus so onBlur doesn't close before click
            e.preventDefault();
            if (blurTimer.current) clearTimeout(blurTimer.current);
          }}
        >
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => addTag(s.name)}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <span>#{s.name}</span>
                <span className="text-xs text-muted-foreground">
                  {s.postCount} post{s.postCount === 1 ? "" : "s"}
                </span>
              </button>
            </li>
          ))}
          {showCreate && (
            <li>
              <button
                type="button"
                onClick={() => addTag(draftSlug)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Plus className="h-4 w-4" /> Create &ldquo;{draftSlug}&rdquo;
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
