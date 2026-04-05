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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0ebe3" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1220" },
  ],
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
        {/* Inline script: apply preset CSS vars before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem('deriverse.preset');if(!p||p==='paper')return;var T={winter:{b:'#e8edf4',c:'#f0f4f9',f:'#dce4ee',bo:'#8a95a8',t:'#1a2940',br:'#3b6fa0'},spring:{b:'#eaf0e6',c:'#f2f7ef',f:'#dfe8d8',bo:'#8a9a7d',t:'#1a3018',br:'#4a7a3a'},summer:{b:'#f5eedd',c:'#faf5ea',f:'#ede4d0',bo:'#a09070',t:'#3a2810',br:'#c47a20'},glass:{b:'#f0f2f5',c:'#f7f8fa',f:'#e8ecf0',bo:'#a0aab8',t:'#1a202c',br:'#3182ce'},soft:{b:'#f0eaf4',c:'#f7f2fa',f:'#e8ddef',bo:'#a090b0',t:'#2a1840',br:'#7a5aa0'},retro:{b:'#f0e8d4',c:'#f8f0dc',f:'#e8dcc4',bo:'#a09070',t:'#2a1e0a',br:'#b87820'}};var v=T[p];if(!v)return;var d=document.documentElement.style;d.setProperty('--bs-bg',v.b);d.setProperty('--bs-card',v.c);d.setProperty('--bs-card-fg',v.f);d.setProperty('--bs-border',v.bo);d.setProperty('--bs-text-primary',v.t);d.setProperty('--bs-brand',v.br);d.setProperty('--background',v.b);d.setProperty('--foreground',v.t);d.setProperty('--card',v.c);d.setProperty('--border',v.bo)}catch(e){}})()`,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
