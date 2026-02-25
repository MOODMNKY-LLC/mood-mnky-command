import "dotenv/config"
import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js"
import {
  createRedisClient,
  checkRateLimit,
  rateLimitKey,
  getProfileIdByDiscordUserId,
  sendDiscordEvent,
  getAgentReply,
  type RedisClient,
} from "@mnky/discord-bots-shared"
import { CODE_COMMANDS, AGENT_SLUG } from "./commands.js"

const token = process.env.CODE_MNKY_DISCORD_BOT_TOKEN
const apiKey = process.env.MOODMNKY_API_KEY
const baseUrl = (process.env.VERSE_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(
  /\/$/,
  ""
)
const redisUrl = process.env.REDIS_URL

if (!token) {
  console.error("Missing CODE_MNKY_DISCORD_BOT_TOKEN")
  process.exit(1)
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })
let redis: RedisClient | null = null

async function main() {
  redis = await createRedisClient(redisUrl)

  client.once(Events.ClientReady, async (c) => {
    console.log(`CODE MNKY bot ready as ${c.user.tag}`)
    const rest = new REST().setToken(token!)
    const commandsJson = CODE_COMMANDS.map((cmd) =>
      typeof cmd.options !== "undefined" && cmd.options.length > 0
        ? { ...cmd, options: cmd.options }
        : { ...cmd }
    ) as unknown[]
    await rest.put(Routes.applicationCommands(c.application.id), {
      body: commandsJson,
    })
    console.log("Slash commands registered")
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
      interaction.options.getString("question") ??
      interaction.options.getString("context") ??
      interaction.options.getString("topic") ??
      (commandName === "lab" ? "Tell me about MNKY LABZ and developer resources." : "")
    const message =
      commandName === "lab" ? "Tell me about MNKY LABZ and developer docs." : query

    await interaction.deferReply()

    const profileId = await getProfileIdByDiscordUserId(baseUrl, apiKey, userId)
    if (profileId && guildId !== "dm") {
      await sendDiscordEvent(baseUrl, apiKey, {
        profileId,
        discordUserId: userId,
        guildId,
        channelId,
        eventType: "message",
        eventRef: `slash:${commandName}`,
      })
    }

    const reply = await getAgentReply(baseUrl, apiKey, {
      agentSlug: AGENT_SLUG,
      message,
      discordUserId: userId,
      channelId,
    })

    if ("error" in reply) {
      await interaction.editReply({
        content: `Something went wrong: ${reply.error}. Try again later.`,
      })
      return
    }

    const text = reply.text.slice(0, 2000)
    if (commandName === "lab") {
      const labzUrl = `${baseUrl}/labz`
      await interaction.editReply({
        content: `${text}\n\n**MNKY LABZ:** ${labzUrl}`,
      })
    } else {
      await interaction.editReply({ content: text })
    }
  })

  client.login(token)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
