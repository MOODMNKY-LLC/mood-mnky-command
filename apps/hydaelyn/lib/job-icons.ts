/**
 * FFXIV job name to icon slug (filename without extension).
 * Icons are at public/images/jobs/{slug}.png.
 * Icons currently present: astrologian, dragoon, monk, ninja, paladin, samurai, scholar, warrior, white-mage.
 * Other slugs (black-mage, red-mage, etc.) map correctly for when icons are added.
 */

const JOB_TO_SLUG: Record<string, string> = {
  "astrologian": "astrologian",
  "bard": "bard",
  "black mage": "black-mage",
  "blackmage": "black-mage",
  "dark knight": "dark-knight",
  "darkknight": "dark-knight",
  "dragoon": "dragoon",
  "dancer": "dancer",
  "gunbreaker": "gunbreaker",
  "machinist": "machinist",
  "monk": "monk",
  "ninja": "ninja",
  "paladin": "paladin",
  "reaper": "reaper",
  "red mage": "red-mage",
  "redmage": "red-mage",
  "sage": "sage",
  "samurai": "samurai",
  "scholar": "scholar",
  "summoner": "summoner",
  "warrior": "warrior",
  "white mage": "white-mage",
  "whitemage": "white-mage",
};

/**
 * Normalize job name (ACT/FFLogs style) to icon slug for public/images/jobs/{slug}.png.
 * Returns null if no icon exists for this job.
 */
export function jobToIconSlug(job: string | null | undefined): string | null {
  if (job == null || job === "") return null;
  const normalized = job.toLowerCase().trim();
  return JOB_TO_SLUG[normalized] ?? null;
}

/**
 * Return the public path for a job icon, or null if no icon.
 */
export function getJobIconPath(job: string | null | undefined): string | null {
  const slug = jobToIconSlug(job);
  return slug ? `/images/jobs/${slug}.png` : null;
}
