"use client";

import { Montserrat, Oswald, Roboto } from "next/font/google";
import { ThemePaletteProvider } from "@/components/theme-palette-provider";
import { VerseThemeProvider } from "@/components/verse/verse-theme-provider";
// Dojo storefront CSS (shared with verse assets until cleanup)
import "../(storefront)/verse/verse-glass.css";
import "../(storefront)/verse/verse-storefront.css";
import "../(storefront)/verse/mnky-box.css";

const montserrat = Montserrat({
  weight: ["500", "900"],
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});
const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});
const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

/**
 * Client-only chrome for dojo storefront: theme, fonts, PWA.
 * Must be wrapped by VerseAuthContext in a Server Component (e.g. (storefront)/layout.tsx).
 */
export function DojoStorefrontChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${montserrat.variable} ${oswald.variable} ${roboto.variable}`}>
      <ThemePaletteProvider>
        <VerseThemeProvider>
          {children}
        </VerseThemeProvider>
      </ThemePaletteProvider>
    </div>
  );
}
