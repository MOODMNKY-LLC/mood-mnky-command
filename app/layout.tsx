import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Source_Code_Pro } from "next/font/google"

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
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${sourceCodePro.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
