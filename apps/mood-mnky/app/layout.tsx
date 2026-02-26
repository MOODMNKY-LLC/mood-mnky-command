import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

export const metadata: Metadata = {
  title: "MOOD MNKY – Brand Ambassador",
  description:
    "Your virtual brand ambassador. Refined, minimalist elegance—innovation and fragrance in one place.",
  applicationName: "MOOD MNKY",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="main" className={spaceGrotesk.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider defaultTheme="light" attribute="class" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
