import {
  Geist,
  Geist_Mono,
  Inter,
  Lora,
  Merriweather,
  Source_Serif_4,
  JetBrains_Mono,
} from "next/font/google";

// Loaded once at module scope (required by next/font). Each exposes a CSS var.
export const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });
export const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
});
export const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});
export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

/** All font CSS-variable classes, applied to <html> so every font is available. */
export const fontVariables = [
  geist,
  geistMono,
  inter,
  lora,
  merriweather,
  sourceSerif,
  jetbrains,
]
  .map((f) => f.variable)
  .join(" ");

/** User-selectable fonts. `key` is what we store in User.font + the data-font attr. */
export const FONTS = [
  { key: "geist", label: "Geist" },
  { key: "inter", label: "Inter" },
  { key: "lora", label: "Lora (serif)" },
  { key: "merriweather", label: "Merriweather (serif)" },
  { key: "source-serif", label: "Source Serif" },
  { key: "jetbrains", label: "JetBrains Mono" },
  { key: "system", label: "System default" },
] as const;

export type FontKey = (typeof FONTS)[number]["key"];

export const FONT_KEYS = FONTS.map((f) => f.key) as FontKey[];
export const DEFAULT_FONT: FontKey = "geist";

export function isFontKey(value: string): value is FontKey {
  return (FONT_KEYS as string[]).includes(value);
}

// Curated themes. `swatch` is a representative color for the picker;
// `base` tells the toaster whether to render light/dark chrome.
export const THEMES = [
  { key: "light", label: "Light", swatch: "oklch(0.97 0 0)", base: "light" },
  { key: "dark", label: "Dark", swatch: "oklch(0.21 0 0)", base: "dark" },
  { key: "midnight", label: "Midnight", swatch: "oklch(0.32 0.08 264)", base: "dark" },
  { key: "rose", label: "Rose", swatch: "oklch(0.58 0.19 16)", base: "light" },
  { key: "emerald", label: "Emerald", swatch: "oklch(0.6 0.13 162)", base: "light" },
  { key: "solarized", label: "Solarized", swatch: "oklch(0.45 0.06 195)", base: "dark" },
  { key: "system", label: "System", swatch: "oklch(0.6 0 0)", base: "system" },
] as const;

export type ThemeKey = (typeof THEMES)[number]["key"];
export const THEME_KEYS = THEMES.map((t) => t.key) as ThemeKey[];
export const DEFAULT_THEME: ThemeKey = "system";

export const THEME_BASE: Record<ThemeKey, "light" | "dark" | "system"> =
  Object.fromEntries(THEMES.map((t) => [t.key, t.base])) as Record<
    ThemeKey,
    "light" | "dark" | "system"
  >;

export function isThemeKey(value: string): value is ThemeKey {
  return (THEME_KEYS as string[]).includes(value);
}
