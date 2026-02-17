import { Montserrat, Oswald, Roboto } from "next/font/google";
import { VerseAuthContext } from "@/components/verse/verse-auth-context";
import { VerseThemeProvider } from "@/components/verse/verse-theme-provider";
import { VersePwaInstall } from "@/components/verse/verse-pwa-install";
import "./verse-glass.css";
import "./verse-storefront.css";

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

export default function VerseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${montserrat.variable} ${oswald.variable} ${roboto.variable}`}>
      <VerseThemeProvider>
        <VerseAuthContext>
          {children}
          <VersePwaInstall />
        </VerseAuthContext>
      </VerseThemeProvider>
    </div>
  );
}
