/**
 * Server-only: encrypt/decrypt Discord webhook tokens at rest.
 * Uses AES-256-GCM. Key from DISCORD_WEBHOOK_ENCRYPTION_KEY (32-byte hex or base64).
 */

import crypto from "node:crypto"

const ALGO = "aes-256-gcm"
const IV_LENGTH = 16
const TAG_LENGTH = 16
const KEY_LENGTH = 32

function getKey(): Buffer {
  const raw = process.env.DISCORD_WEBHOOK_ENCRYPTION_KEY?.trim()
  if (!raw || raw.length < 32) {
    throw new Error("DISCORD_WEBHOOK_ENCRYPTION_KEY must be set and at least 32 chars (e.g. 32-byte hex)")
  }
  if (Buffer.isEncoding("hex") && raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
    return Buffer.from(raw, "hex")
  }
  return Buffer.from(raw.slice(0, KEY_LENGTH), "utf8")
}

export function encryptWebhookToken(plain: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LENGTH })
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString("base64url")
}

export function decryptWebhookToken(encrypted: string): string {
  const key = getKey()
  const buf = Buffer.from(encrypted, "base64url")
  if (buf.length < IV_LENGTH + TAG_LENGTH) throw new Error("Invalid encrypted token")
  const iv = buf.subarray(0, IV_LENGTH)
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const data = buf.subarray(IV_LENGTH + TAG_LENGTH)
  const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: TAG_LENGTH })
  decipher.setAuthTag(tag)
  return decipher.update(data).toString("utf8") + decipher.final("utf8")
}
