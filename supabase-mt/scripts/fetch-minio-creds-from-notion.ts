/**
 * Fetch MinIO/S3 credentials from Notion MOOD MNKY Credentials database,
 * test them, and update supabase-mt/.env.local if they work.
 *
 * Run from repo root with Notion + env loaded:
 *   pnpm exec dotenv -e .env.local -e .env -- tsx supabase-mt/scripts/fetch-minio-creds-from-notion.ts
 *
 * Or from apps/web (for Notion + S3 SDK):
 *   cd apps/web && pnpm exec dotenv -e ../../.env.local -e ../../.env -- tsx ../../supabase-mt/scripts/fetch-minio-creds-from-notion.ts
 *
 * Requires: NOTION_API_KEY in .env.local. Notion DB: MOOD MNKY Credentials (6f2a478a094342d59c80e03eb6c2a5ef).
 */

import "dotenv/config"
import * as fs from "fs"
import * as path from "path"

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_VERSION = "2022-06-28"
const CREDENTIALS_DB_ID = "6f2a478a094342d59c80e03eb6c2a5ef"

interface NotionProperty {
  id: string
  type: string
  title?: Array<{ plain_text: string }>
  rich_text?: Array<{ plain_text: string }>
}

function getTitle(prop: NotionProperty | undefined): string {
  if (!prop?.title) return ""
  return prop.title.map((t) => t.plain_text).join("").trim()
}

function getRichText(prop: NotionProperty | undefined): string {
  if (!prop?.rich_text) return ""
  return prop.rich_text.map((t) => t.plain_text).join("").trim()
}

async function notionQueryDatabase(databaseId: string): Promise<Array<{ id: string; properties: Record<string, NotionProperty> }>> {
  const url = `https://api.notion.com/v1/databases/${databaseId}/query`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 100 }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Notion API ${res.status}: ${text}`)
  }
  const data = (await res.json()) as { results: Array<{ id: string; properties: Record<string, NotionProperty> }> }
  return data.results
}

function findProp(props: Record<string, NotionProperty>, names: string[]): NotionProperty | undefined {
  const keys = Object.keys(props)
  for (const name of names) {
    const key = keys.find((k) => k.toLowerCase() === name.toLowerCase())
    if (key) return props[key]
  }
  return undefined
}

async function main() {
  if (!NOTION_API_KEY) {
    console.error("NOTION_API_KEY is required. Load .env.local (e.g. dotenv -e .env.local).")
    process.exit(1)
  }

  console.log("Querying MOOD MNKY Credentials database for MinIO/S3...")
  const pages = await notionQueryDatabase(CREDENTIALS_DB_ID)

  const nameOrUseCaseLike = (p: { properties: Record<string, NotionProperty> }) => {
    const titleProp = findProp(p.properties, ["Parent Program", "Name", "Title", "Service"])
    const name = (getTitle(titleProp) || getRichText(titleProp)).toLowerCase()
    const useCases = getRichText(findProp(p.properties, ["Use Cases", "UseCases"])).toLowerCase()
    const examples = getRichText(findProp(p.properties, ["Examples"])).toLowerCase()
    const combined = name + " " + useCases + " " + examples
    return (
      name.includes("minio") ||
      name.includes("s3") ||
      combined.includes("minio") ||
      combined.includes(" s3 ") ||
      combined.includes("s3 storage") ||
      combined.includes("s3-api")
    )
  }

  const matches = pages.filter(nameOrUseCaseLike)
  if (matches.length === 0) {
    console.log("No MinIO or S3 credential row found in Notion. Add a row with Name/Parent Program or Use Cases containing 'MinIO' or 'S3'.")
    process.exit(0)
  }

  console.log("Candidate rows:", matches.length)
  const page = matches[0]
  const props = page.properties
  const keyCode = getRichText(findProp(props, ["Key Code", "KeyCode", "Access Key", "Access Key ID"]))
  const apiKey = getRichText(findProp(props, ["API Key", "APIKey", "Secret", "Secret Key"]))
  const text = getRichText(findProp(props, ["Text", "Secret Access Key", "Secret"]))
  const examples = getRichText(findProp(props, ["Examples", "Endpoint", "URL"]))
  const useCases = getRichText(findProp(props, ["Use Cases"]))

  let accessKey = (keyCode || "").trim().replace(/\s+/g, "")
  let secretKey = (apiKey || text || "").trim().replace(/\r?\n/g, "").replace(/\s+$/, "")
  let endpoint = (examples || useCases || "").trim()
  if (endpoint && !endpoint.startsWith("http")) endpoint = "https://" + endpoint.replace(/^\/\//, "")
  if (!endpoint) endpoint = process.env.S3_ENDPOINT_URL || process.env.MINIO_ENDPOINT || "https://s3-api-data.moodmnky.com"

  console.log("Found credential row. Access key present:", !!accessKey, "Secret present:", !!secretKey, "Endpoint:", endpoint || "(from env)")

  const fromNotion = !!(keyCode && (apiKey || text))
  if (!accessKey || !secretKey) {
    console.log("Key Code or secret missing in Notion row. Trying repo .env.local S3 vars...")
    accessKey = (process.env.S3_STORAGE_ACCESS_KEY_ID || process.env.S3_PROTOCOL_ACCESS_KEY_ID || "").trim()
    secretKey = (process.env.S3_STORAGE_SECRET_ACCESS_KEY || process.env.S3_PROTOCOL_ACCESS_KEY_SECRET || "").trim()
    endpoint = process.env.S3_ENDPOINT_URL || process.env.MINIO_ENDPOINT || "https://s3-api-data.moodmnky.com"
    if (!accessKey || !secretKey) {
      console.log("No fallback S3 credentials in env. Not updating config.")
      process.exit(0)
    }
  }

  const { S3Client, ListBucketsCommand } = await import("@aws-sdk/client-s3")
  const endpointsToTry = [endpoint, "http://127.0.0.1:9000", "http://localhost:9000"].filter(Boolean)
  let testOk = false

  for (const ep of endpointsToTry) {
    try {
      const client = new S3Client({
        region: process.env.S3_STORAGE_REGION || "us-east-1",
        endpoint: ep,
        forcePathStyle: true,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      })
      await client.send(new ListBucketsCommand({}))
      testOk = true
      console.log("MinIO/S3 ListBuckets succeeded at", ep)
      endpoint = ep
      break
    } catch (e) {
      const msg = (e as Error).message || ""
      console.warn("  ", ep, "->", msg.slice(0, 60) + (msg.length > 60 ? "..." : ""))
    }
  }

  if (!testOk && fromNotion) {
    console.log("Notion creds failed. Trying repo .env.local S3_STORAGE_* as fallback...")
    const fallbackKey = (process.env.S3_STORAGE_ACCESS_KEY_ID || process.env.S3_PROTOCOL_ACCESS_KEY_ID || "").trim()
    const fallbackSecret = (process.env.S3_STORAGE_SECRET_ACCESS_KEY || process.env.S3_PROTOCOL_ACCESS_KEY_SECRET || "").trim()
    const fallbackEndpoint = process.env.S3_ENDPOINT_URL || "https://s3-api-data.moodmnky.com"
    if (fallbackKey && fallbackSecret) {
      for (const ep of [fallbackEndpoint, "http://127.0.0.1:9000"]) {
        try {
          const client = new S3Client({
            region: process.env.S3_STORAGE_REGION || "us-east-1",
            endpoint: ep,
            forcePathStyle: true,
            credentials: { accessKeyId: fallbackKey, secretAccessKey: fallbackSecret },
          })
          await client.send(new ListBucketsCommand({}))
          testOk = true
          accessKey = fallbackKey
          secretKey = fallbackSecret
          endpoint = ep
          console.log("MinIO/S3 ListBuckets succeeded with env fallback at", ep)
          break
        } catch {
          // ignore
        }
      }
    }
  }

  if (!testOk) {
    console.log("Skipping config update: no endpoint accepted these credentials. Fix the Notion row or ensure MinIO/S3 is reachable.")
    process.exit(0)
  }

  const envPath = path.join(__dirname, "..", ".env.local")
  if (!fs.existsSync(envPath)) {
    console.error(".env.local not found at", envPath)
    process.exit(1)
  }

  let content = fs.readFileSync(envPath, "utf-8")

  const updates: Array<{ key: string; value: string }> = [
    { key: "MINIO_ROOT_USER", value: accessKey },
    { key: "MINIO_ROOT_PASSWORD", value: secretKey },
    { key: "S3_STORAGE_ACCESS_KEY_ID", value: accessKey },
    { key: "S3_STORAGE_SECRET_ACCESS_KEY", value: secretKey },
  ]
  if (endpoint) {
    updates.push({ key: "MINIO_ENDPOINT", value: endpoint })
    updates.push({ key: "S3_ENDPOINT_URL", value: endpoint })
  }

  for (const { key, value } of updates) {
    const quoted = value.includes(" ") ? `"${value}"` : value
    const regex = new RegExp(`^(\\s*${key}\\s*=\\s*).*$`, "m")
    if (regex.test(content)) {
      content = content.replace(regex, `$1${quoted}`)
    } else {
      const anchor = content.includes("MINIO_ROOT_USER") ? "MINIO_ROOT_USER" : "MINIO_ENDPOINT"
      const anchorRegex = new RegExp(`^(\\s*${anchor}\\s*=.*)$`, "m")
      if (anchorRegex.test(content)) {
        content = content.replace(anchorRegex, (m) => m + "\n" + key + "=" + quoted)
      } else {
        content += "\n" + key + "=" + quoted + "\n"
      }
    }
  }

  fs.writeFileSync(envPath, content, "utf-8")
  console.log("Updated", envPath, "with MinIO/S3 credentials from Notion.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
