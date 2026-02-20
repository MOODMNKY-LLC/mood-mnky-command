import { Montserrat } from "next/font/google";

import { AuthModeToggle } from "@/components/auth/auth-mode-toggle"

const montserrat = Montserrat({
  weight: ["500", "900"],
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={montserrat.variable}>
      <div className="fixed right-4 top-4 z-50">
        <AuthModeToggle />
      </div>
      {children}
    </div>
  );
}
