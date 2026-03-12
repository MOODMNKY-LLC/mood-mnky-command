import type {
  SlashCommandBuilder,
  SlashCommandStringOption,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js"

const mood = {
  name: "mood",
  description: "Ask MOOD MNKY about brand, fragrance, or vibe",
  options: [
    {
      name: "query",
      type: 3, // STRING
      description: "Your question or topic",
      required: true,
    },
  ],
} satisfies RESTPostAPIChatInputApplicationCommandsJSONBody

const scent = {
  name: "scent",
  description: "Search scents or get a fragrance story",
  options: [
    {
      name: "query",
      type: 3,
      description: "Fragrance name, note, or theme",
      required: true,
    },
  ],
}

const blend = {
  name: "blend",
  description: "Get a blend suggestion or recipe idea",
  options: [
    {
      name: "theme",
      type: 3,
      description: "Mood or theme for the blend",
      required: true,
    },
  ],
}

const verse = {
  name: "verse",
  description: "Link to MNKY VERSE and the Verse experience",
  options: [],
}

export const MOOD_COMMANDS = [mood, scent, blend, verse] as const
export const AGENT_SLUG = "mood_mnky" as const
