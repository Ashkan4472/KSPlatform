import type { Metadata } from "next";
import "./globals.css";
import { fontVariables, DEFAULT_THEME, DEFAULT_FONT } from "@/lib/fonts";
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
  let theme = DEFAULT_THEME as string;
  let font = DEFAULT_FONT as string;
  if (session?.user?.id) {
    const prefs = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true, font: true },
    });
    if (prefs) {
      theme = prefs.theme;
      font = prefs.font;
    }
  }

  return (
    <html
      lang="en"
      data-font={font}
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers defaultTheme={theme}>
          <Navbar />
          <main className="flex flex-1 flex-col">{children}</main>
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
