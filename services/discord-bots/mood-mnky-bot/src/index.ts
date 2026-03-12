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
import { MOOD_COMMANDS, AGENT_SLUG } from "./commands.js"

const log = createLogger("bot")
const token = process.env.MOOD_MNKY_DISCORD_BOT_TOKEN
const apiKey = process.env.MOODMNKY_API_KEY
const baseUrl = (process.env.VERSE_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(
  /\/$/,
  ""
)
const redisUrl = process.env.REDIS_URL

if (!token) {
  log.error("startup_failed", { reason: "Missing MOOD_MNKY_DISCORD_BOT_TOKEN" })
  process.exit(1)
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })
let redis: RedisClient | null = null

async function main() {
  redis = await createRedisClient(redisUrl)

  client.once(Events.ClientReady, async (c) => {
    console.log(`MOOD MNKY bot ready as ${c.user.tag}`)
    const rest = new REST().setToken(token!)
    const commandsJson = MOOD_COMMANDS.map((cmd) =>
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
        content: "You’re sending too many requests. Please wait a minute.",
        ephemeral: true,
      })
      return
    }

    const query =
      interaction.options.getString("query") ??
      interaction.options.getString("theme") ??
      (commandName === "verse" ? "verse" : "")
    const message = commandName === "verse" ? "Tell me about MNKY VERSE and how to get there." : query

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

    const reply = await getAgentReply(baseUrl, apiKey, {
      agentSlug: AGENT_SLUG,
      message,
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

    const text = reply.text.slice(0, 2000)
    if (commandName === "verse") {
      const verseUrl = `${baseUrl}/verse`
      await interaction.editReply({
        content: `${text}\n\n**MNKY VERSE:** ${verseUrl}`,
      })
    } else {
      await interaction.editReply({ content: text })
    }
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
