import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js"

const code = {
  name: "code",
  description: "Ask CODE MNKY a tech or code question",
  options: [
    { name: "question", type: 3, description: "Your question or topic", required: true },
  ],
} satisfies RESTPostAPIChatInputApplicationCommandsJSONBody

const deploy = {
  name: "deploy",
  description: "Deploy hints or link to deploy docs",
  options: [
    { name: "context", type: 3, description: "What you're deploying (e.g. Vercel, Docker)", required: false },
  ],
}

const pr = {
  name: "pr",
  description: "PR checklist or code-review tips",
  options: [
    { name: "topic", type: 3, description: "e.g. checklist, review", required: false },
  ],
}

const lab = {
  name: "lab",
  description: "Link to MNKY LABZ and developer docs",
  options: [],
}

export const CODE_COMMANDS = [code, deploy, pr, lab] as const
export const AGENT_SLUG = "code_mnky" as const
