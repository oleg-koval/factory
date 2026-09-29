import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Script from "next/script";
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
  title: "Factory: AI Coding Agent Verification | Oleg Koval",
  description:
    "Open-source MIT delivery skill for Claude Code and Codex. It checks criteria, tests, reviews, and receipts before an AI coding agent can claim “delivered.”",
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
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-0RRTME2WMJ"
          strategy="beforeInteractive"
        />
        <Script id="google-analytics" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0RRTME2WMJ');
          `}
        </Script>
        <Script id="launch-events" strategy="afterInteractive">
          {`
            document.addEventListener('copy', function () {
              var text = String(window.getSelection() || '');
              if (text.indexOf('npx --yes skills add ') !== -1) {
                gtag('event', 'install_command_copy', { page_path: location.pathname });
              }
            });
            document.addEventListener('click', function (event) {
              var link = event.target instanceof Element ? event.target.closest('a[href]') : null;
              if (!link) return;
              var href = link.getAttribute('href') || '';
              var base = 'https://github.com/oleg-koval/factory';
              if (href === base || href.indexOf(base + '/') === 0) {
                gtag('event', 'github_click', { link_url: href, page_path: location.pathname });
              } else if (href === '/proof/') {
                gtag('event', 'proof_open', { page_path: location.pathname });
              }
            });
          `}
        </Script>
      </head>
      <body
        className={`${plexSans.variable} ${plexMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
