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
  title: "SAGE MNKY – Wisdom & Guidance",
  description:
    "Wisdom-focused advisor and mentor. Thoughtful guidance, reflection, and perspective for complex decisions and growth.",
  applicationName: "SAGE MNKY",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="sage" className={spaceGrotesk.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider defaultTheme="light" attribute="class" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
