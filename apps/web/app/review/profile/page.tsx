import Link from "next/link"
import { DojoCharacterCard } from "@/components/dojo/dojo-character-card"
import { ILLUSTRATIVE_MEMBER_HOME } from "@/lib/review/illustrative-member-home"

export default function ReviewProfilePage() {
  const data = ILLUSTRATIVE_MEMBER_HOME
  return (
    <div className="mx-auto w-full max-w-lg space-y-4 p-4 md:p-8">
      <p className="text-xs text-muted-foreground">
        Illustrative profile — not a real account.{" "}
        <Link href="/review" className="underline underline-offset-2">
          Review hub
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">Profile (sample)</h1>
      <DojoCharacterCard
        displayName={data.displayName}
        avatarUrl={null}
        email={data.email}
        xpTotal={data.xpTotal}
        level={data.level}
        handle="preview-member"
        shopifyLinked={false}
      />
    </div>
  )
}
