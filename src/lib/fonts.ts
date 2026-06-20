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

// --- Combinable appearance: base × accent × size ---

// Base controls light/dark (managed by next-themes via a class).
export const BASES = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "System" },
] as const;
export type BaseKey = (typeof BASES)[number]["key"];
export const BASE_KEYS = BASES.map((b) => b.key) as BaseKey[];
export const DEFAULT_BASE: BaseKey = "system";
export function isBase(value: string): value is BaseKey {
  return (BASE_KEYS as string[]).includes(value);
}

// Accent overrides the primary color (works on light and dark) via data-accent.
export const ACCENTS = [
  { key: "neutral", label: "Neutral", swatch: "oklch(0.55 0 0)" },
  { key: "rose", label: "Rose", swatch: "oklch(0.58 0.19 16)" },
  { key: "emerald", label: "Emerald", swatch: "oklch(0.6 0.13 162)" },
  { key: "violet", label: "Violet", swatch: "oklch(0.55 0.22 292)" },
  { key: "blue", label: "Blue", swatch: "oklch(0.55 0.18 255)" },
  { key: "amber", label: "Amber", swatch: "oklch(0.72 0.16 70)" },
] as const;
export type AccentKey = (typeof ACCENTS)[number]["key"];
export const ACCENT_KEYS = ACCENTS.map((a) => a.key) as AccentKey[];
export const DEFAULT_ACCENT: AccentKey = "neutral";
export function isAccent(value: string): value is AccentKey {
  return (ACCENT_KEYS as string[]).includes(value);
}

// Size scales the whole UI (root rem) via data-size.
export const SIZES = [
  { key: "compact", label: "Compact" },
  { key: "comfortable", label: "Comfortable" },
  { key: "large", label: "Large" },
] as const;
export type SizeKey = (typeof SIZES)[number]["key"];
export const SIZE_KEYS = SIZES.map((s) => s.key) as SizeKey[];
export const DEFAULT_SIZE: SizeKey = "comfortable";
export function isSize(value: string): value is SizeKey {
  return (SIZE_KEYS as string[]).includes(value);
}
