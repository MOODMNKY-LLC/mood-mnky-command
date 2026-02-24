import React from "react"
import type { Metadata, Viewport } from "next"
import { headers } from "next/headers"
import { Inter, Source_Code_Pro, Space_Grotesk } from "next/font/google"

import { PwaRegister } from "@/components/pwa-register"
import { PointerWithLogo } from "@/components/pointer-with-logo"
import { ThemeProvider } from "@/components/theme-provider"
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
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

export const metadata: Metadata = {
  title: "MOOD MNKY LABZ",
  description:
    "Formula calculator, fragrance oil catalog, and product builder for MOOD MNKY",
  applicationName: "MOOD MNKY LABZ",
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
    title: "MOOD MNKY LABZ",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "MOOD MNKY LABZ",
    title: "MOOD MNKY LABZ",
    description:
      "Formula calculator, fragrance oil catalog, and product builder for MOOD MNKY",
  },
  twitter: {
    card: "summary",
    title: "MOOD MNKY LABZ",
    description:
      "Formula calculator, fragrance oil catalog, and product builder for MOOD MNKY",
  },
}

export const viewport: Viewport = {
  themeColor: "#f1f5f9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const host = headersList.get("host") ?? ""
  const isNgrok = host.includes("ngrok")

  return (
    <html lang="en" className={`${inter.variable} ${sourceCodePro.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider defaultTheme="light" attribute="class" enableSystem>
          <PointerWithLogo>
            <PwaRegister registerSw={!isNgrok}>{children}</PwaRegister>
          </PointerWithLogo>
        </ThemeProvider>
      </body>
    </html>
  )
}
