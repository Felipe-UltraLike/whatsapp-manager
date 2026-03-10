import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NextAuthProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhatsApp Manager - Gestão de Instâncias",
  description: "Sistema de gestão de instâncias WhatsApp com integração uaZapi",
  keywords: ["WhatsApp", "uaZapi", "Gestão", "Instâncias", "Next.js"],
  authors: [{ name: "WhatsApp Manager" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <NextAuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </NextAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
