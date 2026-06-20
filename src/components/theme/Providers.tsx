"use client";

import { ThemeProvider } from "next-themes";
import { BASE_KEYS } from "@/lib/fonts";

/**
 * Theme provider for the light/dark/system base (next-themes class).
 * Accent and size are applied via server-rendered `data-accent` / `data-size`
 * attributes on <html> (see layout.tsx), so they compose with the base.
 */
export function Providers({
  children,
  defaultTheme,
}: {
  children: React.ReactNode;
  defaultTheme: string;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      themes={BASE_KEYS}
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
