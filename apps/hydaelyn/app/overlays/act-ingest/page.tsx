import { redirect } from "next/navigation";

/**
 * Redirect /overlays/act-ingest and /overlays/act-ingest/ to the static overlay
 * so both URLs work (Next.js does not serve index.html for directory paths).
 */
export default async function ActIngestOverlayRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((vv) => q.append(k, vv));
    else if (v != null) q.set(k, v);
  });
  const query = q.toString();
  redirect(`/overlays/act-ingest/index.html${query ? `?${query}` : ""}`);
}
