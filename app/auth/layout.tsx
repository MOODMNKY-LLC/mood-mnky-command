import { Montserrat } from "next/font/google";

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
      {children}
    </div>
  );
}
