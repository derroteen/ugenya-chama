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

export const metadata: Metadata = {
  title: "Ugenya Association Eldoret (UAE)",
  description:
    "Ugenya Association Eldoret is a community savings and welfare association supporting members and families across its branches.",
  openGraph: {
    title: "Ugenya Association Eldoret (UAE)",
    description:
      "Ugenya Association Eldoret is a community savings and welfare association supporting members and families across its branches.",
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
