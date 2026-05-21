import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@omega/ui";
import { CommandPaletteProvider } from "@/components/CommandPalette";
import { ToastProvider } from "@/components/ToastProvider";
import { ShortcutsProvider } from "@/components/ui/KeyboardShortcuts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Omega - Build Something Extraordinary",
  description:
    "Production-grade AI content infrastructure. Create stunning presentations, websites, documents, and visual stories.",
  keywords: ["saas", "next.js", "react", "typescript", "mongodb", "ai", "content creation"],
  authors: [{ name: "Omega Team" }],
  openGraph: {
    title: "Omega - Build Something Extraordinary",
    description:
      "Production-grade AI content infrastructure. Create stunning presentations, websites, documents, and visual stories.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <CommandPaletteProvider>
            <ShortcutsProvider>
              <ToastProvider>
              {/* Skip to main content link for accessibility */}
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
              >
                Skip to main content
              </a>
              {children}
              </ToastProvider>
            </ShortcutsProvider>
          </CommandPaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
