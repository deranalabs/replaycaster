import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Farcaster Replay 2025",
  description: "Explore your 2025 Farcaster year in review with interactive slides and statistics",
  icons: {
    icon: "/replaycaster-logo.png",
    shortcut: "/replaycaster-logo.png",
    apple: "/replaycaster-logo.png",
  },
  openGraph: {
    title: "Farcaster Replay 2025",
    description: "Discover your Farcaster story - stats, casts, channels, and persona",
    images: ["/replaycaster-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100`}
      >
        {children}
      </body>
    </html>
  );
}
