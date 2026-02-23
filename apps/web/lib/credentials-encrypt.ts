import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto"

const ALGO = "aes-256-gcm"
const KEY_LEN = 32
const IV_LEN = 16
const TAG_LEN = 16
const SALT_LEN = 32

function getKey(): Buffer | null {
  const raw = process.env.SERVICES_CREDENTIALS_ENCRYPTION_KEY
  if (!raw || raw.length < 16) return null
  return scryptSync(raw, "mnky-labz-salt", KEY_LEN)
}

export function encryptCredentials(plain: string): string | null {
  const key = getKey()
  if (!key) return null
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString("base64")
}

export function decryptCredentials(encrypted: string): string | null {
  const key = getKey()
  if (!key) return null
  try {
    const buf = Buffer.from(encrypted, "base64")
    if (buf.length < IV_LEN + TAG_LEN) return null
    const iv = buf.subarray(0, IV_LEN)
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
    const data = buf.subarray(IV_LEN + TAG_LEN)
    const decipher = createDecipheriv(ALGO, key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data) as Buffer, decipher.final()]).toString("utf8")
  } catch {
    return null
  }
}

export function isCredentialsEncryptionConfigured(): boolean {
  return getKey() != null
}
