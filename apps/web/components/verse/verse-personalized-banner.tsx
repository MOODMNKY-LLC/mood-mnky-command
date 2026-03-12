import { BlurFade } from "@/components/ui/blur-fade";

type VersePersonalizedBannerProps = {
  displayName?: string | null;
  mappedAnswers?: Record<string, unknown>;
};

export function VersePersonalizedBanner({
  displayName,
  mappedAnswers,
}: VersePersonalizedBannerProps) {
  const targetMood =
    mappedAnswers?.target_mood &&
    typeof mappedAnswers.target_mood === "string" &&
    mappedAnswers.target_mood.trim()
      ? (mappedAnswers.target_mood as string).trim()
      : null;
  const productType =
    mappedAnswers?.product_type &&
    typeof mappedAnswers.product_type === "string" &&
    mappedAnswers.product_type.trim()
      ? (mappedAnswers.product_type as string).trim()
      : null;

  let copy: string | null = null;
  if (targetMood) {
    copy = `Based on your love of ${targetMood}, explore these picks below.`;
  } else if (productType) {
    copy = `Explore our ${productType} selection below.`;
  } else if (displayName) {
    copy = `Welcome back, ${displayName}. Find your next favorite scent.`;
  }

  if (!copy) return null;

  return (
    <BlurFade delay={0.06} inView inViewMargin="-20px">
      <p className="text-verse-text-muted text-sm italic">{copy}</p>
    </BlurFade>
  );
}
