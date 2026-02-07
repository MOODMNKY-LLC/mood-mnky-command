import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Source_Code_Pro } from "next/font/google"

import { PwaRegister } from "@/components/pwa-register"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})
const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code-pro",
  display: "swap",
})

export const metadata: Metadata = {
  title: "MOOD MNKY Lab",
  description:
    "Formula calculator, fragrance oil catalog, and product builder for MOOD MNKY",
  applicationName: "MOOD MNKY Lab",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MOOD MNKY Lab",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "MOOD MNKY Lab",
    title: "MOOD MNKY Lab",
    description:
      "Formula calculator, fragrance oil catalog, and product builder for MOOD MNKY",
  },
  twitter: {
    card: "summary",
    title: "MOOD MNKY Lab",
    description:
      "Formula calculator, fragrance oil catalog, and product builder for MOOD MNKY",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${sourceCodePro.variable}`}>
      <body className="font-sans antialiased">
        <PwaRegister>{children}</PwaRegister>
      </body>
    </html>
  )
}
