import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/responsive.css";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import { StakingProvider } from "@/lib/context/StakingContext";
import { Toaster } from "@/components/ui/toaster";

// Configure Inter font
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Staking Rewards Dashboard",
  description: "Track your staking rewards across multiple providers.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider storageKey="staking-rewards-theme">
          <StakingProvider>
            {children}
          </StakingProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
