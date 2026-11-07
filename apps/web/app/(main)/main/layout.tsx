import type { Metadata } from "next"
import { MainAuthContext } from "@/components/main/main-auth-context"
import { MainTalkToAgentProvider } from "@/components/main/main-talk-to-agent-context"
import {
  MainTouchpointTourProvider,
  MainTouchpointTour,
} from "@/components/main"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./main-site.css"
import "./main-glass.css"

const baseUrl =
  typeof process.env.NEXT_PUBLIC_MAIN_APP_URL === "string" &&
  process.env.NEXT_PUBLIC_MAIN_APP_URL.length > 0
    ? process.env.NEXT_PUBLIC_MAIN_APP_URL
    : "https://www.moodmnky.com"

export const metadata: Metadata = {
  title: "MOOD MNKY – Fragrance, Community, Innovation",
  description:
    "MOOD MNKY — bespoke fragrance, community, and MNKY ID. Explore The Dojo, blending, and honest account paths.",
  applicationName: "MOOD MNKY",
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: "website",
    siteName: "MOOD MNKY",
    title: "MOOD MNKY – Fragrance, Community, Innovation",
    description:
      "MOOD MNKY — bespoke fragrance, community, and MNKY ID. Explore The Dojo, blending, and honest account paths.",
    url: baseUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "MOOD MNKY – Fragrance, Community, Innovation",
    description:
      "MOOD MNKY — bespoke fragrance, community, and MNKY ID. Explore The Dojo, blending, and honest account paths.",
  },
  alternates: {
    canonical: baseUrl,
  },
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="main-site min-h-screen bg-background text-foreground">
      <TooltipProvider>
        <MainTalkToAgentProvider>
          <MainTouchpointTourProvider>
            <MainAuthContext>{children}</MainAuthContext>
            <MainTouchpointTour />
          </MainTouchpointTourProvider>
        </MainTalkToAgentProvider>
      </TooltipProvider>
    </div>
  )
}
