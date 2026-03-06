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
import AppBackground from "@/components/layout/AppBackground";
import Providers from "./providers";
import { Toaster } from "sonner";
import AssistantModal from "@/components/ui/AssistantModal";

export const metadata: Metadata = {
  title: "Y(Why)DEX",
  description: "YDex is a app engineered by Yamparala Rahul to make TRADING simple.",
  icons: {
    icon: "/favicon.png",
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
        <Providers>
          <AppBackground />
          <div className="hidden md:block h-full">
            {children}
          </div>
          <LoadingScreen />
          <AssistantModal />
        </Providers>
        <Toaster
          position="top-right"
          theme="dark"
          closeButton
          expand={false}
          offset={24}
          toastOptions={{
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              color: 'white',
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '14px',
              padding: '16px 20px',
            },
          }}
        />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
