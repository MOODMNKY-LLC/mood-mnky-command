import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js"

const verse = {
  name: "verse",
  description: "What is MNKY VERSE and how to get there",
  options: [],
} satisfies RESTPostAPIChatInputApplicationCommandsJSONBody

const drops = {
  name: "drops",
  description: "Current drops and link to the Verse drops page",
  options: [
    { name: "topic", type: 3, description: "Optional topic or question", required: false },
  ],
}

const quests = {
  name: "quests",
  description: "How quests work and link to the Verse quests page",
  options: [
    { name: "topic", type: 3, description: "Optional topic or question", required: false },
  ],
}

const rewards = {
  name: "rewards",
  description: "Rewards catalog and link to the Verse rewards page",
  options: [],
}

const dojo = {
  name: "dojo",
  description: "Dojo and community hub link",
  options: [
    { name: "topic", type: 3, description: "Optional topic or question", required: false },
  ],
}

const ask = {
  name: "ask",
  description: "Ask the Verse concierge a question",
  options: [
    { name: "question", type: 3, description: "Your question", required: true },
  ],
}

export const VERSE_COMMANDS = [verse, drops, quests, rewards, dojo, ask] as const
export const AGENT_SLUG = "mnky_verse" as const
