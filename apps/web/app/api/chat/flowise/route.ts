import { handleFlowisePredict } from "@/lib/flowise/predict-handler"

/**
 * Alias for POST /api/flowise/predict. Same body and response.
 * Recommended "chat" namespace for Flowise; predict route remains for backward compatibility.
 */
export const maxDuration = 60

export async function POST(request: Request) {
  return handleFlowisePredict(request)
}
