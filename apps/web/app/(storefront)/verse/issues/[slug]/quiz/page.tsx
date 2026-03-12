import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { VerseQuizClient } from "@/components/verse/verse-quiz-client"

export const dynamic = "force-dynamic"

const SAMPLE_QUESTIONS = [
  {
    id: "q1",
    question: "Where does the traveler first discover Midnight Oud?",
    options: ["Santorini cliffside", "Istanbul bazaar", "Marrakech rooftop", "Kyoto temple"],
    correctIndex: 1,
  },
  {
    id: "q2",
    question: "What fragrance is tied to white cliffs and wildflowers?",
    options: ["Desert Rose", "Midnight Oud", "Ocean Bloom", "Alpine Mist"],
    correctIndex: 2,
  },
  {
    id: "q3",
    question: "Which scent is described as warm, velvety, unforgettable?",
    options: ["Ocean Bloom", "Temple Incense", "Desert Rose", "Midnight Oud"],
    correctIndex: 2,
  },
  {
    id: "q4",
    question: "How many chapters does Passport of the Senses have?",
    options: ["1", "2", "3", "4"],
    correctIndex: 2,
  },
  {
    id: "q5",
    question: "What did the vendor say about Midnight Oud?",
    options: ["For the bold", "For the weary", "For the dreamer", "For the wise"],
    correctIndex: 0,
  },
]

export default async function VerseQuizPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: issue, error } = await supabase
    .from("mnky_issues")
    .select("id, slug, title")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (error || !issue) notFound()

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] space-y-8 px-4 py-8 md:px-6">
      <Link
        href={`/verse/issues/${slug}`}
        className="text-primary text-sm underline"
      >
        ← Back to {issue.title}
      </Link>

      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">
          Quiz: {issue.title}
        </h1>
        <p className="text-muted-foreground">
          Test your knowledge. Score 70% or higher to pass and earn XP.
        </p>
      </div>

      <VerseQuizClient
        issueId={issue.id}
        questions={SAMPLE_QUESTIONS}
        passThreshold={70}
      />
    </div>
  )
}
