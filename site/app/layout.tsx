import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import "./run-map.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://factory.olegkoval.com"),
  title: "Factory — Delivery gates for AI coding agents",
  description:
    "An open-source skill that makes coding agents prove the work before they call it delivered.",
  applicationName: "Factory",
  authors: [{ name: "Oleg Koval", url: "https://factory.olegkoval.com/oleg-koval/" }],
  creator: "Oleg Koval",
  keywords: [
    "AI coding agent verification",
    "Claude Code skill",
    "Codex skill",
    "software factory delivery gates",
    "agent acceptance criteria",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    siteName: "Factory",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og-factory.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-factory.png"],
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plexSans.variable} ${plexMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
