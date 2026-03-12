import type { Metadata } from "next"
import { Space_Grotesk, Source_Code_Pro } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})
const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "CODE MNKY – Coding Companion",
  description:
    "Your virtual A.I. coding companion. DevOps expertise, code completions, and step-by-step technical guidance.",
  applicationName: "CODE MNKY",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="code"
      className={spaceGrotesk.variable + " " + sourceCodePro.variable}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider defaultTheme="light" attribute="class" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
