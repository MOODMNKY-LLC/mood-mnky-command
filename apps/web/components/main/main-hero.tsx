"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"
import { useScroll, useTransform, motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { BlurFade } from "@/components/ui/blur-fade"

export function MainHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.4])
  const scale = useTransform(scrollYProgress, [0, 0.4], [1, 0.98])
  const y = useTransform(scrollYProgress, [0, 0.3], [0, 24])

  return (
    <BlurFade delay={0.1} inView inViewMargin="-20px">
      <motion.section
        ref={sectionRef}
        style={{ opacity, scale }}
        className="relative mx-auto max-w-4xl text-center min-h-[var(--main-hero-min-height,60vh)] flex flex-col justify-center"
      >
        <motion.div
          style={{ y }}
          className="main-glass-panel mx-auto mb-8 inline-block overflow-hidden p-4"
        >
          <Image
            src="/verse/mood-mnky-3d.png"
            alt="MOOD MNKY"
            width={160}
            height={160}
            className="object-contain"
            sizes="(max-width: 768px) 160px, 160px"
            priority
          />
        </motion.div>
        <h1
          className="text-foreground font-bold tracking-tight"
          style={{ fontSize: "var(--main-hero-title-size)" }}
        >
          Welcome to the MNKY DOJO
        </h1>
        <p
          className="mt-4 text-muted-foreground"
          style={{ fontSize: "var(--main-hero-subtitle-size)" }}
        >
          Bespoke fragrance, sensory journeys, extreme personalization.
          <br />
          Always scentsing the MOOD.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/dojo">Join MNKY DOJO</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dojo/fragrance-wheel">Fragrance Wheel</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>
      </motion.section>
    </BlurFade>
  )
}
