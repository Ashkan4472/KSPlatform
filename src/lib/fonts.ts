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

export const THEMES = ["light", "dark", "system"] as const;
export type ThemeKey = (typeof THEMES)[number];
export const DEFAULT_THEME: ThemeKey = "system";

export function isThemeKey(value: string): value is ThemeKey {
  return (THEMES as readonly string[]).includes(value);
}
