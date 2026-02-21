import type { Metadata } from "next"
import "./main-site.css"

const baseUrl =
  typeof process.env.NEXT_PUBLIC_MAIN_APP_URL === "string" &&
  process.env.NEXT_PUBLIC_MAIN_APP_URL.length > 0
    ? process.env.NEXT_PUBLIC_MAIN_APP_URL
    : "https://www.moodmnky.com"

export const metadata: Metadata = {
  title: "MOOD MNKY – Fragrance, Community, Innovation",
  description:
    "Bespoke fragrance and the MNKY VERSE. Explore our community, blending lab, and fragrance oils.",
  applicationName: "MOOD MNKY",
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: "website",
    siteName: "MOOD MNKY",
    title: "MOOD MNKY – Fragrance, Community, Innovation",
    description:
      "Bespoke fragrance and the MNKY VERSE. Explore our community, blending lab, and fragrance oils.",
    url: baseUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "MOOD MNKY – Fragrance, Community, Innovation",
    description:
      "Bespoke fragrance and the MNKY VERSE. Explore our community, blending lab, and fragrance oils.",
  },
  alternates: {
    canonical: baseUrl,
  },
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="main-site min-h-screen bg-background text-foreground">{children}</div>
}
