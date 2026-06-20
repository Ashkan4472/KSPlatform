import type { Metadata } from "next";
import "./globals.css";
import {
  fontVariables,
  DEFAULT_BASE,
  DEFAULT_ACCENT,
  DEFAULT_SIZE,
  DEFAULT_FONT,
  DEFAULT_SURFACE,
  DEFAULT_RADIUS,
  DEFAULT_CARD_STYLE,
  DEFAULT_BORDER_DENSITY,
  DEFAULT_SHADOW,
} from "@/lib/fonts";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Providers } from "@/components/theme/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "KSPlatform — Share what you know",
  description:
    "A knowledge-sharing platform. Write posts, tag them, subscribe to topics.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  let base = DEFAULT_BASE as string;
  let accent = DEFAULT_ACCENT as string;
  let size = DEFAULT_SIZE as string;
  let font = DEFAULT_FONT as string;
  let surface = DEFAULT_SURFACE as string;
  let radius = DEFAULT_RADIUS as string;
  let cardStyle = DEFAULT_CARD_STYLE as string;
  let borderDensity = DEFAULT_BORDER_DENSITY as string;
  let shadow = DEFAULT_SHADOW as string;
  if (session?.user?.id) {
    const prefs = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        theme: true,
        accent: true,
        size: true,
        font: true,
        surface: true,
        radius: true,
        cardStyle: true,
        borderDensity: true,
        shadow: true,
      },
    });
    if (prefs) {
      base = prefs.theme;
      accent = prefs.accent;
      size = prefs.size;
      font = prefs.font;
      surface = prefs.surface;
      radius = prefs.radius;
      cardStyle = prefs.cardStyle;
      borderDensity = prefs.borderDensity;
      shadow = prefs.shadow;
    }
  }

  return (
    <html
      lang="en"
      data-font={font}
      data-accent={accent}
      data-size={size}
      data-surface={surface}
      data-radius={radius}
      data-card={cardStyle}
      data-border={borderDensity}
      data-shadow={shadow}
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers defaultTheme={base}>
          <Navbar />
          <main className="flex flex-1 flex-col">{children}</main>
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
