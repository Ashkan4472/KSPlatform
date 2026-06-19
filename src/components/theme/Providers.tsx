"use client";

import { ThemeProvider } from "next-themes";

/**
 * Theme provider only (light/dark/system). Font is applied via a server-rendered
 * `data-font` attribute on <html>, so we don't need a second next-themes provider
 * (keeping a single theme context that the sonner toaster reads via useTheme).
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
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
