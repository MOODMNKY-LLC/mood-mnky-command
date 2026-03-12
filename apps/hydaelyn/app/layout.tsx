import type { Metadata } from "next";
import Script from "next/script";
import { HydaelynAuthContext } from "@/components/hydaelyn-auth-context";
import { ConditionalRootHeader } from "@/components/conditional-root-header";
import { ThemeProvider } from "@/components/theme-provider";
import { HydaelynThemeScript } from "@/components/hydaelyn-theme-script";
import "./globals.css";

// Same-origin so ACT CEF doesn't block cross-origin script
const OVERLAY_PLUGIN_SCRIPT = "/overlay-plugin-common.min.js";

export const metadata: Metadata = {
  title: "Hydaelyn — Pull stats & stream command center for the Warriors of Light",
  description:
    "Where the light gathers: pull tracking, OBS overlays, ACT ingest, and FFLogs in one place. For Warriors of Light who stream and raid.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Script
          src={OVERLAY_PLUGIN_SCRIPT}
          strategy="beforeInteractive"
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <HydaelynThemeScript />
          <HydaelynAuthContext>
            <ConditionalRootHeader />
            {children}
          </HydaelynAuthContext>
        </ThemeProvider>
      </body>
    </html>
  );
}
