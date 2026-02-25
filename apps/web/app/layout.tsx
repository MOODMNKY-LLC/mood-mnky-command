import React from "react"
import type { Metadata, Viewport } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { Inter, Source_Code_Pro, Space_Grotesk } from "next/font/google"

import { PwaRegister } from "@/components/pwa-register"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"
import { PointerWithLogo } from "@/components/pointer-with-logo"
import { GlobalAudioProvider } from "@/components/main/global-audio-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemePaletteProvider } from "@/components/theme-palette-provider"
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
        <Script
          id="theme-palette-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("theme-palette");document.documentElement.dataset.theme=(t==="dojo"?t:"main");})();`,
          }}
        />
        <ThemeProvider defaultTheme="light" attribute="class" enableSystem>
          <ThemePaletteProvider>
          <GlobalAudioProvider>
            <PointerWithLogo>
              <PwaRegister registerSw={!isNgrok}>{children}</PwaRegister>
              <PwaInstallPrompt />
            </PointerWithLogo>
          </GlobalAudioProvider>
          </ThemePaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
