import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import {
  GeistPixelGrid,
} from 'geist/font/pixel';
import "./globals.css";
import '@pqina/flip/dist/flip.min.css';
import { Agentation } from "agentation";
import LoadingScreen from "@/components/ui/LoadingScreen";
import MobileRestrictedView from "@/components/layout/MobileRestrictedView";

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
          ${GeistPixelGrid.variable} 
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
