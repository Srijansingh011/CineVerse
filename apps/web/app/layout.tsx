import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader" });

export const metadata: Metadata = {
  title: "CineVerse — Discover & Book Tickets",
  description: "A social movie discovery, reviews, and real-time seat booking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${newsreader.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
