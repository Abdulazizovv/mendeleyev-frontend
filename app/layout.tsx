import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { PWAInstaller } from "@/components/pwa-installer";
import { PWAInstallButton } from "@/components/pwa-install-button";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mendeleyev - Ta'lim platformasi",
  description: "O'zbekiston maktablari va o'quv markazlari uchun ta'lim boshqaruv platformasi",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mendeleyev",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Mendeleyev",
    title: "Mendeleyev - Ta'lim platformasi",
    description: "O'zbekiston maktablari va o'quv markazlari uchun ta'lim boshqaruv platformasi",
  },
  twitter: {
    card: "summary",
    title: "Mendeleyev - Ta'lim platformasi",
    description: "O'zbekiston maktablari va o'quv markazlari uchun ta'lim boshqaruv platformasi",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <PWAInstaller />
        <PWAInstallButton />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
