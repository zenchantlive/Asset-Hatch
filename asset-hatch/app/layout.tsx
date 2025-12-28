import type { Metadata } from "next";
import { Inter, Instrument_Sans } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

// =============================================================================
// FONT CONFIGURATION
// Configure Google Fonts for the application
// =============================================================================

// Inter font for body text
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Instrument Sans for headings
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

// =============================================================================
// METADATA
// SEO metadata for the application
// =============================================================================

export const metadata: Metadata = {
  title: "Asset Hatch",
  description: "AI-Powered Game Asset Studio",
};

// =============================================================================
// ROOT LAYOUT
// Wraps all pages with providers and global styles
// =============================================================================

import { Header } from "@/components/layout/Header";

// ... existing imports

// ... existing font config

// ... existing metadata

// =============================================================================
// ROOT LAYOUT
// Wraps all pages with providers and global styles
// =============================================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${instrumentSans.variable} font-sans antialiased flex flex-col min-h-screen bg-background`}
      >
        {/* SessionProvider enables useSession hook in client components */}
        <SessionProvider>
          <Header />
          <main className="flex-1 relative">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
