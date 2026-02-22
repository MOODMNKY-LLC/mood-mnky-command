"use client"

import { BlurFade } from "@/components/ui/blur-fade"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { MainLandingFaqItem } from "@/lib/main-landing-data"

const FAQ_FALLBACK: MainLandingFaqItem[] = [
  {
    id: "1",
    question: "What is MOOD MNKY?",
    answer:
      "MOOD MNKY is a luxury fragrance brand focused on extreme personalization. We offer bespoke scents, the Blending Lab for creating your own blend, and AI companions that guide you through discovery and customization.",
    sort_order: 0,
  },
  {
    id: "2",
    question: "What is the Blending Lab?",
    answer:
      "The Blending Lab is our interactive space where you choose fragrance notes and ratios to create a custom scent. You can experiment with accords and receive a handcrafted bottle that’s uniquely yours.",
    sort_order: 1,
  },
  {
    id: "3",
    question: "How do I customize my scent?",
    answer:
      "Visit the Blending Lab (or blending guide) to explore our note library, adjust ratios, and save your profile. You can also work with MOOD MNKY—our AI companion—for recommendations before you blend.",
    sort_order: 2,
  },
  {
    id: "4",
    question: "Do you ship internationally?",
    answer:
      "We currently ship to select regions. Check the footer or contact page for the latest shipping options and delivery times. Custom blends may have slightly longer lead times.",
    sort_order: 3,
  },
  {
    id: "5",
    question: "What is the VERSE?",
    answer:
      "The VERSE is our storefront and community space: shop ready-to-wear scents, explore the Blending Lab, and connect with MOOD MNKY and other AI companions for a full sensory journey.",
    sort_order: 4,
  },
]

export function MainFaq({ items }: { items?: MainLandingFaqItem[] | null }) {
  const faqItems = (items != null && items.length > 0 ? items : FAQ_FALLBACK)
  return (
    <BlurFade delay={0.14} inView inViewMargin="-20px">
      <section
        className="max-w-2xl"
        style={{ marginTop: "var(--main-section-gap)" }}
      >
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="border-b border-border">
          {faqItems.map(({ id, question, answer }) => (
            <AccordionItem key={id} value={id} className="border-border">
              <AccordionTrigger className="text-left text-foreground hover:no-underline hover:text-muted-foreground">
                {question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </BlurFade>
  )
}
