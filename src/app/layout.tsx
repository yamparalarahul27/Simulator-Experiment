import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import {
  GeistPixelSquare,
} from 'geist/font/pixel';
import "./globals.css";
import { Agentation } from "agentation";
import LoadingScreen from "@/components/LoadingScreen";
import MobileRestrictedView from "@/components/MobileRestrictedView";

export const metadata: Metadata = {
  title: "Deriverse",
  description: "Deriverse Trade Lookup and Analytics Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${GeistSans.variable} 
          ${GeistMono.variable} 
          ${GeistPixelSquare.variable} 
          antialiased
        `}
      >
        <div className="hidden md:block">
          {children}
        </div>
        <div className="md:hidden">
          <MobileRestrictedView />
        </div>

        <LoadingScreen />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
