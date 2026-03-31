import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import {
  GeistPixelGrid,
} from 'geist/font/pixel';
import "./globals.css";
import '@pqina/flip/dist/flip.min.css';
import { Agentation } from "agentation";
import { ThemeProvider } from "@/components/ThemeProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f0ebe3",
};

export const metadata: Metadata = {
  title: "YDEX — Solving Why of DEX",
  description: "Learn DEX trading through interactive simulators and guided lessons. Understand order types, risk management, and the Solana ecosystem — hands-on.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "YDEX — Solving Why of DEX",
    description: "Learn DEX trading through interactive simulators and guided lessons.",
    siteName: "YDEX",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`
          ${GeistSans.variable}
          ${GeistMono.variable}
          ${GeistPixelGrid.variable}
          antialiased
        `}
      >
        {/* Static splash overlay — renders before React hydrates to prevent dark flash */}
        <div
          id="splash-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            backgroundColor: 'var(--bs-bg)',
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
