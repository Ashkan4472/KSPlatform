"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FONTS, type FontKey } from "@/lib/fonts";
import { updatePreferencesAction } from "@/actions/preferences";

export function FontSelect({ initial }: { initial: FontKey }) {
  const [font, setFont] = useState<FontKey>(initial);

  // Apply the selected font (no reload) by setting the attribute the CSS reads.
  useEffect(() => {
    document.documentElement.dataset.font = font;
  }, [font]);

  function choose(key: FontKey) {
    setFont(key);
    void updatePreferencesAction({ font: key });
  }

  const current = FONTS.find((f) => f.key === font) ?? FONTS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-60 justify-between">
          <span className="flex items-center">
            <Type className="mr-2 h-4 w-4" /> {current.label}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        {FONTS.map((f) => (
          <DropdownMenuItem key={f.key} onSelect={() => choose(f.key)}>
            <span className="flex-1">{f.label}</span>
            {f.key === font && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
