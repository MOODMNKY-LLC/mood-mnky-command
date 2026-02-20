import OpenAI from "openai"

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set; OpenAI modules will fail at runtime.")
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
})
