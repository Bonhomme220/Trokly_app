import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Trokly — iPhones de confiance au Bénin",
    template: "%s | Trokly",
  },
  description:
    "Achetez et vendez des iPhones expertisés à Cotonou. Marketplace + troc avec soulte, garantie qualité Trokly.",
  icons: {
    icon: "/symbol.svg",
    apple: "/symbol.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1A2B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>

        {/* WhatsPAY Pixel de Conversion */}
        <Script id="whatspay-pixel" strategy="afterInteractive">{`
(function() {
  var ref = new URLSearchParams(window.location.search).get('wp_ref');
  if (ref) localStorage.setItem('wp_ref', ref);
  var r = localStorage.getItem('wp_ref');
  var page = encodeURIComponent(window.location.pathname);
  if (r) new Image().src = 'https://whatspay.africa/api/pixel/31b0611e-2588-48f3-aa73-8564ff347495?event=page_view&ref=' + r + '&page=' + page;
  window.wpTrackConversion = function(event) {
    var r2 = localStorage.getItem('wp_ref');
    new Image().src = 'https://whatspay.africa/api/pixel/31b0611e-2588-48f3-aa73-8564ff347495?event=' + (event || 'purchase') + (r2 ? '&ref=' + r2 : '') + '&page=' + page;
  };
})();
        `}</Script>
        {/* Fin WhatsPAY Pixel */}
      </body>
    </html>
  );
}
