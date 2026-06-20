"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEMES } from "@/lib/fonts";
import { updatePreferencesAction } from "@/actions/preferences";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Standard next-themes hydration guard.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  function choose(value: string) {
    setTheme(value);
    void updatePreferencesAction({ theme: value });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((t) => (
          <DropdownMenuItem key={t.key} onSelect={() => choose(t.key)}>
            <span
              className="mr-2 h-4 w-4 rounded-full border"
              style={{ background: t.swatch }}
            />
            <span className="flex-1">{t.label}</span>
            {mounted && theme === t.key && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
