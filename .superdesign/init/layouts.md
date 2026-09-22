# Shared layouts

## `site/app/_components/SiteHeader.tsx`

Global sticky navigation.

```tsx
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Factory home">Factory<span aria-hidden="true">.</span></Link>
      <div className="header-status"><span className="status-dot" aria-hidden="true" />Open source / local proof</div>
      <nav aria-label="Primary navigation">
        <a href="/how-it-works/">How</a><a href="/proof/">Proof</a>
        <a href="/essays/right-to-say-not-delivered/">Essay</a><a href="/install/">Install</a>
        <a href="/oleg-koval/">Built by Oleg</a>
      </nav>
      <a className="header-cta" href="/proof/">Inspect proof<span aria-hidden="true">↘</span></a>
    </header>
  );
}
```

## `site/app/_components/SiteFooter.tsx`

Global product navigation and evidence metadata.

```tsx
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div><Link className="wordmark" href="/">Factory<span aria-hidden="true">.</span></Link><p>The verification layer for AI software factories.</p></div>
      <nav aria-label="Footer navigation"><a href="/how-it-works/">How it works</a><a href="/proof/">Proof</a><a href="/install/">Install</a><a href="/changelog/">Changelog</a><a href="/oleg-koval/">Oleg Koval</a></nav>
      <div className="footer-meta"><span>MIT licensed</span><span>Built for Claude Code + Codex</span><span>Evidence updated 2026-09-21</span></div>
    </footer>
  );
}
```

## `site/app/layout.tsx`

Next/vinext root layout. Loads IBM Plex Sans and Mono, canonical metadata, social metadata, and global CSS.

```tsx
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://factory.olegkoval.com"),
  title: "Factory — Delivery gates for AI coding agents",
  description: "An open-source skill that makes coding agents prove the work before they call it delivered.",
  applicationName: "Factory",
  authors: [{ name: "Oleg Koval", url: "https://factory.olegkoval.com/oleg-koval/" }],
  creator: "Oleg Koval",
  keywords: ["AI coding agent verification", "Claude Code skill", "Codex skill", "software factory delivery gates", "agent acceptance criteria"],
  alternates: { canonical: "/" },
  openGraph: { siteName: "Factory", locale: "en_US", type: "website", images: [{ url: "/og-factory.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: ["/og-factory.png"] },
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${plexSans.variable} ${plexMono.variable} antialiased`}>{children}</body></html>;
}
```
