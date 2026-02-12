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
import Providers from "./providers";

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
        suppressHydrationWarning
        className={`
          ${GeistSans.variable} 
          ${GeistMono.variable} 
          ${GeistPixelGrid.variable} 
          antialiased
        `}
      >
        <Providers>
          <div className="hidden md:block">
            {children}
          </div>
          <div className="md:hidden">
            <MobileRestrictedView />
          </div>
          <LoadingScreen />
        </Providers>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
