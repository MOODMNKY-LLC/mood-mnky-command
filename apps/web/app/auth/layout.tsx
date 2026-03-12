import { Montserrat, Oswald, Roboto } from "next/font/google";

import { AuthModeToggle } from "@/components/auth/auth-mode-toggle"
import { AuthVerseShell } from "@/components/auth/auth-verse-shell"
import "../(storefront)/verse/verse-storefront.css"
import "../(storefront)/verse/verse-glass.css"
import "./auth-shell.css"

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

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${montserrat.variable} ${oswald.variable} ${roboto.variable}`}>
      <div className="fixed right-4 top-4 z-50">
        <AuthModeToggle />
      </div>
      <AuthVerseShell>{children}</AuthVerseShell>
    </div>
  );
}
