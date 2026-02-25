import "dotenv/config"
import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js"
import {
  createRedisClient,
  checkRateLimit,
  rateLimitKey,
  getProfileIdByDiscordUserId,
  sendDiscordEvent,
  getAgentReply,
  createLogger,
  maskBaseUrl,
  type RedisClient,
} from "@mnky/discord-bots-shared"
import { VERSE_COMMANDS, AGENT_SLUG } from "./commands.js"

const log = createLogger("bot")
const token = process.env.MNKY_VERSE_DISCORD_BOT_TOKEN
const apiKey = process.env.MOODMNKY_API_KEY
const baseUrl = (process.env.VERSE_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(
  /\/$/,
  ""
)
const redisUrl = process.env.REDIS_URL

if (!token) {
  log.error("startup_failed", { reason: "Missing MNKY_VERSE_DISCORD_BOT_TOKEN" })
  process.exit(1)
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })
let redis: RedisClient | null = null

function verseLink(path: string): string {
  return baseUrl ? `${baseUrl}/verse${path}` : ""
}

async function main() {
  log.info("startup", {
    bot: "MNKY_VERSE",
    verse_app_url: baseUrl ? maskBaseUrl(baseUrl) : "(not set)",
    api_key_set: !!apiKey,
    redis_url_set: !!redisUrl,
  })
  redis = await createRedisClient(redisUrl)

  client.once(Events.ClientReady, async (c) => {
    console.log(`MNKY VERSE bot ready as ${c.user.tag}`)
    const rest = new REST().setToken(token!)
    const commandsJson = VERSE_COMMANDS.map((cmd) =>
      typeof cmd.options !== "undefined" && cmd.options.length > 0
        ? { ...cmd, options: cmd.options }
        : { ...cmd }
    ) as unknown[]
    await rest.put(Routes.applicationCommands(c.application.id), {
      body: commandsJson,
    })
    log.info("slash_commands_registered", { count: commandsJson.length })
  })

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return
    const commandName = interaction.commandName
    const userId = interaction.user.id
    const guildId = interaction.guildId ?? "dm"
    const channelId = interaction.channelId ?? undefined

    if (!baseUrl || !apiKey) {
      await interaction.reply({
        content: "Bot is not configured (missing VERSE_APP_URL or MOODMNKY_API_KEY).",
        ephemeral: true,
      })
      return
    }

    const rlKey = rateLimitKey(guildId, userId)
    const allowed = await checkRateLimit(redis, rlKey, 20, 60)
    if (!allowed) {
      await interaction.reply({
        content: "You're sending too many requests. Please wait a minute.",
        ephemeral: true,
      })
      return
    }

    await interaction.deferReply()

    const profileId = await getProfileIdByDiscordUserId(baseUrl, apiKey, userId)
    if (profileId && guildId !== "dm") {
      const eventResult = await sendDiscordEvent(baseUrl, apiKey, {
        profileId,
        discordUserId: userId,
        guildId,
        channelId,
        eventType: "message",
        eventRef: `slash:${commandName}`,
      })
      if (!eventResult.ok) {
        log.warn("event_ingestion_failed", {
          command: commandName,
          guildId,
          error: eventResult.error,
        })
      }
    }

    if (commandName === "ask") {
      const question = interaction.options.getString("question", true)
      const reply = await getAgentReply(baseUrl, apiKey, {
        agentSlug: AGENT_SLUG,
        message: question,
        discordUserId: userId,
        channelId,
      })
      if ("error" in reply) {
        log.error("agent_reply_failed", {
          command: commandName,
          guildId,
          userId,
          error: reply.error,
        })
        await interaction.editReply({
          content: `Something went wrong: ${reply.error}. Try again later.`,
        })
        return
      }
      await interaction.editReply({ content: reply.text.slice(0, 2000) })
      return
    }

    const linkOnly = verseLink("")
    const dropsUrl = verseLink("/drops")
    const questsUrl = verseLink("/quests")
    const rewardsUrl = verseLink("/rewards")

    let content: string
    switch (commandName) {
      case "verse":
        content = `**MNKY VERSE** is the community storefront—drops, quests, rewards, and the Dojo. Open the app to explore.\n\n**MNKY VERSE:** ${linkOnly}`
        break
      case "drops":
        content = `Check out current drops and seasonal releases in the Verse.\n\n**Drops:** ${dropsUrl}`
        break
      case "quests":
        content = `Complete quests to earn XP and level up. Link your Discord in the Verse to track progress.\n\n**Quests:** ${questsUrl}`
        break
      case "rewards":
        content = `Redeem your points for rewards. See the catalog and claim in the Verse.\n\n**Rewards:** ${rewardsUrl}`
        break
      case "dojo":
        content = `The Dojo is your member hub—learning, community, and resources.\n\n**MNKY VERSE (Dojo):** ${linkOnly}`
        break
      default:
        content = `**MNKY VERSE:** ${linkOnly}`
    }

    await interaction.editReply({ content })
  })

  client.login(token)
}

main().catch((err) => {
  log.error("fatal", {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  })
  process.exit(1)
})
