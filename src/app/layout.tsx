import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { MotionProvider } from "@/components/reveal";
import { NavRouter } from "@/components/nav-router";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const DESCRIPTION =
  "Peer-hosted game servers for groups of friends. Replicated saves, automatic failover, and a stable address for every server, with optional always-on cloud anchors.";

export const metadata: Metadata = {
  metadataBase: new URL("https://varde.games"),
  title: {
    default: "Varde | Game servers built by many hands",
    template: "%s | Varde",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "Varde | Game servers built by many hands",
    description: DESCRIPTION,
    url: "https://varde.games",
    siteName: "Varde",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Varde" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Varde | Game servers built by many hands",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  icons: {
    icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark mouve-dark"
      data-theme="mouve-dark"
    >
      <body
        className={`${inter.variable} bg-background font-sans text-foreground antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <NavRouter>
            <SiteNav />
          </NavRouter>
          <div className="flex-1">
            <MotionProvider>{children}</MotionProvider>
          </div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
