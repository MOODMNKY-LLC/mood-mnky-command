"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const FLOWISE_GUI_URL = "https://flowise-dev.moodmnky.com";
const FLOWISE_DOCS_URL = "https://docs.flowiseai.com";

const HOW_TO_CARDS = [
  {
    id: "flowise-vs-openai",
    title: "When to use Flowise vs OpenAI",
    description:
      "Use Flowise for multi-step orchestration, tool-calling against your APIs, centralized agent ops, and rapid iteration (e.g. manga storyboard, quiz generation, fragrance crafting). Use OpenAI direct for production latency and reliability, cost control, embeddings, moderation, and specialized modalities (image/audio).",
  },
  {
    id: "sdk-vs-instance",
    title: "SDK vs instance",
    description:
      "The Flowise SDK is a client that calls the Flowise API; the runtime is the hosted instance (e.g. flowise-dev.moodmnky.com). They work together—this panel calls the Next.js API, which uses the SDK/API to talk to the instance. Never treat the SDK as a replacement for the instance.",
  },
  {
    id: "security",
    title: "Security",
    description:
      "Never call Flowise from the browser (key and ID leakage). All calls go through the backend with FLOWISE_API_KEY. Flowise should call your tool-façade endpoints (e.g. MOODMNKY_API_KEY), not Shopify Admin or other secrets directly.",
  },
  {
    id: "flow-types",
    title: "Flow types (what to build in Flowise)",
    description:
      "Editorial Director (storyboard/panels), Hotspot/Product GID Mapper, Quiz generator (grading in CORE), UGC Caption Coach (moderation in CORE), optional Quest Master. One responsibility per flow; avoid a single \"god flow.\"",
  },
];

export function FlowiseHowToCards() {
  return (
    <div className="space-y-4">
      {HOW_TO_CARDS.map((card) => (
        <Card key={card.id} className="bg-background/75 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm leading-relaxed">
              {card.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
      <Card className="bg-background/75 backdrop-blur border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick links</CardTitle>
          <CardDescription>Flowise instance and documentation.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <a
            href={FLOWISE_GUI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            Flowise GUI
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={FLOWISE_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            Flowise docs
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
