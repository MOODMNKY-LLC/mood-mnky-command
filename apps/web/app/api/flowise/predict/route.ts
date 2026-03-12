import { handleFlowisePredict } from "@/lib/flowise/predict-handler"

/** Predict endpoint forwards to Flowise; see temp/flowise-api-upgraded.json for high-level Flowise REST API. */
export const maxDuration = 60

export async function POST(request: Request) {
  return handleFlowisePredict(request)
}
