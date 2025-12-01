import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "ARC Forge - ARC Raiders Item Database & Crafting Guide",
    template: "%s | ARC Forge",
  },
  description:
    "Complete ARC Raiders item database with crafting trees, recipes, and item information. Browse weapons, modifications, materials, and more for ARC Raiders.",
  keywords: [
    "ARC Raiders",
    "item database",
    "crafting guide",
    "game items",
    "weapons",
    "materials",
    "crafting tree",
    "ARC Forge",
  ],
  authors: [{ name: "ARC Forge" }],
  creator: "ARC Forge",
  publisher: "ARC Forge",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "ARC Forge",
    title: "ARC Forge - ARC Raiders Item Database & Crafting Guide",
    description:
      "Complete ARC Raiders item database with crafting trees, recipes, and item information. Browse weapons, modifications, materials, and more.",
    images: [
      {
        url: "/logo.webp",
        width: 320,
        height: 96,
        alt: "ARC Forge Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ARC Forge - ARC Raiders Item Database",
    description:
      "Complete ARC Raiders item database with crafting trees, recipes, and item information.",
    images: ["/logo.webp"],
    creator: "@arcforge",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"} />
        {/* Favicon links for Google Search and browsers */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {/* Preconnect to external resources for better performance */}
        <link rel="preconnect" href="https://arcraiders.wiki" />
        <link rel="dns-prefetch" href="https://arcraiders.wiki" />
        {GA_TRACKING_ID && (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" />
            <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
          </>
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Google Analytics */}
        {GA_TRACKING_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_TRACKING_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
