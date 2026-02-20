/**
 * Load .env files before any module that reads process.env.
 * Import this first in scripts that need env (e.g. seed-verse-blog-posts).
 */
import { config } from "dotenv"
config({ path: ".env.local" })
config()
