import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";
import { I18nProvider } from "@/contexts/I18nProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fisher Backflows - Professional Backflow Testing & Certification",
  description: "State-certified backflow testing for Pierce County homes and businesses. Fast, reliable, and compliant backflow preventer testing services.",
  keywords: "backflow testing, backflow prevention, Pierce County, Tacoma, backflow certification, water testing",
  authors: [{ name: "Fisher Backflows" }],
  robots: "index, follow"
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <I18nProvider>
          <AppProviders>
            {children}
          </AppProviders>
        </I18nProvider>
        
        {/* Global error tracking script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Session ID for error tracking
              if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('sessionId')) {
                sessionStorage.setItem('sessionId', 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
              }
              
              // Global error tracking
              window.addEventListener('error', function(e) {
                console.error('Global error:', e.error);
              });
              
              window.addEventListener('unhandledrejection', function(e) {
                console.error('Unhandled promise rejection:', e.reason);
              });
            `
          }}
        />
      </body>
    </html>
  );
}
