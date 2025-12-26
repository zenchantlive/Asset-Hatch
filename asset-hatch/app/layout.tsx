import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { CopilotKit } from "@copilotkit/react-core";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Asset Hatch",
  description: "AI-Powered Game Asset Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} font-sans antialiased`}
      >
        <CopilotKit
          runtimeUrl="/api/copilotkit"
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}

