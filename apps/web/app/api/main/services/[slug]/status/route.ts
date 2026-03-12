import { NextResponse } from "next/server"
import { getServiceStatus } from "@/lib/services"
import { MAIN_SERVICES } from "@/lib/main-services-data"

export interface MainServiceStatusResponse {
  configured: boolean
  status?: string
  metrics?: Record<string, number | string>
  error?: string
}

/**
 * GET /api/main/services/[slug]/status
 * Public, safe status and high-level metrics for a deployed service.
 * Returns { configured, status?, metrics?, error? }. No internal URLs or credentials.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const service = MAIN_SERVICES.find((s) => s.id === slug)
  if (!service) {
    return NextResponse.json({ configured: false, error: "Unknown service" }, { status: 404 })
  }
  const result = await getServiceStatus(slug)
  return NextResponse.json({
    configured: result.configured,
    ...(result.status != null && { status: result.status }),
    ...(result.metrics != null && Object.keys(result.metrics).length > 0 && { metrics: result.metrics }),
    ...(result.error != null && { error: result.error }),
  } satisfies MainServiceStatusResponse)
}
