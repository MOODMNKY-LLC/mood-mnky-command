import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BlurFade } from "@/components/ui/blur-fade"
import {
  MainNav,
  MainHeroSplit,
  MainFeatureCards,
  MainSocialProof,
  MainCustomization,
  MainFaq,
  MainGlassCard,
  MainAgentCard,
  MnkyFragranceCard,
  MainChatbot,
  MainWaitlistForm,
  MainVoiceBlock,
  MainListenBlock,
  MainFooter,
} from "@/components/main"
import {
  getMainLandingData,
  getMainAgents,
  getMainFeaturedFragrances,
  getMainElevenLabsConfig,
} from "@/lib/main-landing-data"

function roleFromDisplayName(displayName: string): string {
  const first = displayName.split(" ")[0]
  return first ?? displayName
}

export default async function MainLandingPage() {
  const [landingData, agents, featuredFragrances, elevenLabsConfig] = await Promise.all([
    getMainLandingData(),
    getMainAgents(),
    getMainFeaturedFragrances(),
    getMainElevenLabsConfig(),
  ])

  return (
    <>
      <MainNav />

      <main className="main-container py-12 md:py-20">
        <MainHeroSplit />
        <MainFeatureCards items={landingData.features} />
        <MainSocialProof items={landingData.socialProof} />
        <MainCustomization />
        <MainFaq items={landingData.faq} />

        {/* Featured fragrances – MNKY Science */}
        {featuredFragrances.length > 0 && (
          <BlurFade delay={0.15} inView inViewMargin="-20px">
            <section
              style={{ marginTop: "var(--main-section-gap)" }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  MNKY Science
                </h2>
                <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
                  A few fragrances from our library—explore the full collection
                  in the Blending Lab.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                {featuredFragrances.map((oil) => (
                  <MnkyFragranceCard key={oil.id} oil={oil} />
                ))}
              </div>
            </section>
          </BlurFade>
        )}

        {/* Explore – VERSE + Blending (condensed) */}
        <BlurFade delay={0.16} inView inViewMargin="-20px">
          <section
            className="grid gap-6 md:grid-cols-2"
            style={{ marginTop: "var(--main-section-gap)" }}
          >
            <MainGlassCard className="flex flex-col">
              <h2 className="text-xl font-semibold text-foreground">
                MNKY VERSE
              </h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                Shop, explore the blending guide, and connect in the community.
              </p>
              <Button asChild className="mt-4">
                <Link href="/verse">Explore VERSE</Link>
              </Button>
            </MainGlassCard>
            <MainGlassCard className="flex flex-col">
              <h2 className="text-xl font-semibold text-foreground">
                Blending Lab
              </h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                Create your scent with the formula calculator and fragrance
                library.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/verse/blending-guide">Blending Guide</Link>
              </Button>
            </MainGlassCard>
          </section>
        </BlurFade>

        {/* Meet the MNKYs – Agent character cards */}
        <BlurFade delay={0.17} inView inViewMargin="-20px">
          <section
            style={{ marginTop: "var(--main-section-gap)" }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Meet the MNKYs
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
                Your AI companions for the VERSE—explore, learn, and create.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {agents.map((agent) => (
                <MainAgentCard
                  key={agent.slug}
                  slug={agent.slug}
                  displayName={agent.displayName}
                  role={roleFromDisplayName(agent.displayName)}
                  description={agent.blurb ?? ""}
                  imagePath={agent.imagePath}
                  model={agent.model}
                  tools={agent.tools}
                />
              ))}
            </div>
          </section>
        </BlurFade>

        {/* Meet MOOD MNKY – Chat (compact) */}
        <BlurFade delay={0.18} inView inViewMargin="-20px">
          <section
            style={{ marginTop: "var(--main-section-gap)" }}
            className="space-y-4"
          >
            <h2 className="text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Meet MOOD MNKY
            </h2>
            <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
              Ask about our brand, fragrances, or the MNKY VERSE.
            </p>
            <div className="mx-auto max-w-2xl">
              <MainChatbot />
            </div>
          </section>
        </BlurFade>

        {/* Voice block – Orb, Conversation Bar (when agent configured) */}
        {elevenLabsConfig.showVoiceSection && (
          <BlurFade delay={0.19} inView inViewMargin="-20px">
            <section
              style={{ marginTop: "var(--main-section-gap)" }}
              className="space-y-6"
            >
              <h2 className="text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Talk to MOOD MNKY
              </h2>
              <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
                Start a voice conversation with our AI companion.
              </p>
              <div className="mx-auto max-w-3xl">
                <MainVoiceBlock config={elevenLabsConfig} />
              </div>
            </section>
          </BlurFade>
        )}

        {/* Listen – brand audio sample */}
        {elevenLabsConfig.showAudioSample && (
          <BlurFade delay={0.195} inView inViewMargin="-20px">
            <section
              style={{ marginTop: "var(--main-section-gap)" }}
              className="space-y-6"
            >
              <h2 className="text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Listen
              </h2>
              <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
                A short sensory journey.
              </p>
              <div className="mx-auto max-w-md">
                <MainListenBlock
                  audioSampleUrl={elevenLabsConfig.audioSampleUrl}
                  showAudioSample={elevenLabsConfig.showAudioSample}
                />
              </div>
            </section>
          </BlurFade>
        )}

        {/* Waitlist – slim banner above footer */}
        <BlurFade delay={0.2} inView inViewMargin="-20px">
          <section
            className="border-t border-border pt-12"
            style={{ marginTop: "var(--main-section-gap)" }}
          >
            <div className="mx-auto max-w-xl">
              <MainWaitlistForm />
            </div>
          </section>
        </BlurFade>
      </main>

      <MainFooter />
    </>
  )
}
