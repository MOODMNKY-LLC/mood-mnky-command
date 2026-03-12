import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js"

const sage = {
  name: "sage",
  description: "Ask SAGE MNKY for guidance or a thoughtful perspective",
  options: [
    { name: "question", type: 3, description: "Your question or topic", required: true },
  ],
} satisfies RESTPostAPIChatInputApplicationCommandsJSONBody

const reflect = {
  name: "reflect",
  description: "Get a reflection prompt or exercise",
  options: [
    { name: "topic", type: 3, description: "What you want to reflect on", required: true },
  ],
}

const learn = {
  name: "learn",
  description: "Learning topic or link to Dojo content",
  options: [
    { name: "topic", type: 3, description: "What you want to learn", required: true },
  ],
}

const dojo = {
  name: "dojo",
  description: "Link to the Dojo and learning resources",
  options: [],
}

export const SAGE_COMMANDS = [sage, reflect, learn, dojo] as const
export const AGENT_SLUG = "sage_mnky" as const
