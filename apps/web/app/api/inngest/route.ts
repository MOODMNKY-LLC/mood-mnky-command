import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import {
  shopifyOrderPaid,
  shopifyOrderCancelledOrRefunded,
  discordEventReceived,
  questEvaluate,
  magReadCompleted,
  magQuizPassed,
  magDownloadRecorded,
  ugcOnApproved,
  discordDropAnnounce,
  discordRoleSyncByLevel,
} from "@/lib/inngest/functions"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    shopifyOrderPaid,
    shopifyOrderCancelledOrRefunded,
    discordEventReceived,
    questEvaluate,
    magReadCompleted,
    magQuizPassed,
    magDownloadRecorded,
    ugcOnApproved,
    discordDropAnnounce,
    discordRoleSyncByLevel,
  ],
})
