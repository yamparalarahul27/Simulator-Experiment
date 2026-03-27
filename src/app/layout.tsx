import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import {
  GeistPixelGrid,
} from 'geist/font/pixel';
import "./globals.css";
import '@pqina/flip/dist/flip.min.css';
import { Agentation } from "agentation";

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
        {children}
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
