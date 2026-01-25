import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import "./globals-3d.css";
import { Header } from "@/components/layout/Header";
import { PostHogProvider } from "./providers";
import { TransitionProvider } from "@/components/ui/TransitionProvider";

// =============================================================================
// FONT CONFIGURATION
// Configure Google Fonts for the application
// =============================================================================

// Outfit for modern, geometric body text
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Space Grotesk for clean geometric headings (not serif)
const spaceGrotesk = Space_Grotesk({
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
  icons: {
    icon: "/logo-icon.svg",
  },
  openGraph: {
    title: "Asset Hatch",
    description: "AI-Powered Game Asset Studio",
    images: ["/logo-generated-v2.png"],
  },
};

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
        className={`${outfit.variable} ${spaceGrotesk.variable} font-sans antialiased flex flex-col min-h-screen bg-background`}
      >
        {/* PostHogProvider enables analytics tracking in client components */}
        <PostHogProvider>
          {/* SessionProvider enables useSession hook in client components */}
          <SessionProvider>
            <TransitionProvider>
              <Header />
              <main className="flex-1 relative">
                {children}
              </main>
            </TransitionProvider>
          </SessionProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
