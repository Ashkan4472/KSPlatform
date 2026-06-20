"use client";

import { ThemeProvider } from "next-themes";
import { THEME_KEYS } from "@/lib/fonts";

// Map each theme key to the <html> class the CSS targets.
const themeClasses: Record<string, string> = {
  light: "light",
  dark: "dark",
  midnight: "theme-midnight",
  rose: "theme-rose",
  emerald: "theme-emerald",
  solarized: "theme-solarized",
};

/**
 * Theme provider only (curated themes via class). Font is applied via a
 * server-rendered `data-font` attribute on <html>, so we don't need a second
 * next-themes provider (keeping a single theme context the toaster reads).
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
      themes={THEME_KEYS}
      value={themeClasses}
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
