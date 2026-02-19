import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import {
  shopifyOrderPaid,
  discordEventReceived,
  questEvaluate,
  magReadCompleted,
  magQuizPassed,
  magDownloadRecorded,
  ugcOnApproved,
} from "@/lib/inngest/functions"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    shopifyOrderPaid,
    discordEventReceived,
    questEvaluate,
    magReadCompleted,
    magQuizPassed,
    magDownloadRecorded,
    ugcOnApproved,
  ],
})
