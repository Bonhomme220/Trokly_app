import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LeadProvider } from "@/contexts/LeadContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
          <LeadProvider>
            <Navbar />
            {children}
            <Footer />
          </LeadProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
