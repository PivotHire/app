import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PivotHire - Accelerate Your Growth with AI-Powered Outsourcing",
  description: "The fastest and easiest way to go from idea to product. PivotHire connects you with top-tier engineering talent to build scalable, high-performance software solutions. We bridge the gap between your vision and reality.",
  openGraph: {
    title: "PivotHire - Accelerate Your Growth with AI-Powered Outsourcing",
    description: "The fastest and easiest way to go from idea to product. PivotHire connects you with top-tier engineering talent to build scalable, high-performance software solutions. We bridge the gap between your vision and reality.",
    url: "https://www.pivothire.tech",
    siteName: "PivotHire",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PivotHire - AI-Powered Outsourcing",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PivotHire - Accelerate Your Growth with AI-Powered Outsourcing",
    description: "The fastest and easiest way to go from idea to product. PivotHire connects you with top-tier engineering talent to build scalable, high-performance software solutions. We bridge the gap between your vision and reality.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        layout: {
          shimmer: false,
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
