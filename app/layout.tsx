import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora, Source_Sans_3 } from "next/font/google";
import NavBar from "@/app/components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const uaeDisplay = Lora({
  variable: "--font-uae-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const uaeSans = Source_Sans_3({
  variable: "--font-uae-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://ugenyassociationeldoret.com";
const SITE_TITLE = "Ugenya Association Eldoret (UAE)";
const SITE_DESCRIPTION =
  "Ugenya Association Eldoret is a community savings and welfare association supporting members and households across 12 branches in Eldoret, Kenya. Riwruok Eteko.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Ugenya Association Eldoret",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Ugenya Association Eldoret",
    "UAE chama",
    "Eldoret savings group",
    "community welfare Eldoret",
    "Kenya chama",
  ],
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "Ugenya Association Eldoret",
    images: ["/opengraph-image"],
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
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
      className={`${geistSans.variable} ${geistMono.variable} ${uaeDisplay.variable} ${uaeSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
