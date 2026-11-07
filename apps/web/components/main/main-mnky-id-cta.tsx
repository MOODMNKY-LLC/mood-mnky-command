import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  getMnkyIdEnrollmentState,
  getMnkyIdVipPortalState,
} from "@/lib/mnky-id"
import { loginHrefWithReturn, signUpHrefWithReturn } from "@/lib/auth/safe-return-path"
import { cn } from "@/lib/utils"

type MainMnkyIdCtaProps = {
  className?: string
  /** Compact row for hero; full stack for entry pages. */
  layout?: "hero" | "stack"
}

/**
 * Brand-consistent CTAs for Dojo/shop accounts vs MNKY ID intro.
 * Live enrollment / VIP deep-links only render when config-gated on.
 */
export function MainMnkyIdCta({
  className,
  layout = "hero",
}: MainMnkyIdCtaProps) {
  const enrollment = getMnkyIdEnrollmentState()
  const vip = getMnkyIdVipPortalState()
  const stack = layout === "stack"

  return (
    <div
      className={cn(
        stack ? "flex flex-col gap-3" : "flex flex-wrap gap-3 sm:gap-4",
        className,
      )}
    >
      <Button asChild size="lg" className="main-btn-float">
        <Link href="/main/mnky-id">Your MNKY ID</Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="main-btn-glass">
        <Link href={signUpHrefWithReturn("/main")}>Dojo / shop sign-up</Link>
      </Button>
      <Button asChild size="lg" variant="ghost">
        <Link href={loginHrefWithReturn("/main")}>Existing sign-in</Link>
      </Button>
      {enrollment.enabled ? (
        <Button asChild size="lg" variant="secondary">
          <a href={enrollment.url} rel="noopener noreferrer">
            Create MNKY ID (live)
          </a>
        </Button>
      ) : null}
      {vip.enabled ? (
        <Button asChild size="lg" variant="secondary">
          <a href={vip.url} rel="noopener noreferrer">
            Enter VIP portal
          </a>
        </Button>
      ) : null}
    </div>
  )
}
