import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";
import { I18nProvider } from "@/contexts/I18nProvider";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Fisher Backflows - Professional Backflow Testing & Certification",
  description: "State-certified backflow testing for Pierce County homes and businesses. Fast, reliable, and compliant backflow preventer testing services.",
  keywords: "backflow testing, backflow prevention, Pierce County, Tacoma, backflow certification, water testing",
  authors: [{ name: "Fisher Backflows" }],
  robots: "index, follow",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/icons/icon-152x152.svg", sizes: "152x152", type: "image/svg+xml" }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fisher Backflows"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0066cc"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} antialiased`}
      >
        <ErrorBoundary>
          <I18nProvider>
            <AppProviders>
              {children}
            </AppProviders>
          </I18nProvider>
        </ErrorBoundary>
        
      </body>
    </html>
  );
}
