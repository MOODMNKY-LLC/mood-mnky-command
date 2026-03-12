import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const rootDir = path.resolve(__dirname, "../..")

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ["zod", "eventsource-parser"],
  // Turbopack: use relative paths (Windows absolute paths not supported)
  turbopack: {
    resolveAlias: {
      "zod": "./node_modules/zod",
      "zod/v3": "./node_modules/zod/v3",
      "zod/v4": "./node_modules/zod/v4",
      "eventsource-parser/stream": "./node_modules/eventsource-parser/dist/stream.js",
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, "node_modules"),
      path.resolve(rootDir, "node_modules"),
    ]
    let zodPath
    try {
      zodPath = path.dirname(require.resolve("zod", { paths: [__dirname, rootDir] }))
    } catch {
      zodPath = path.resolve(__dirname, "node_modules/zod")
    }
    const eventsourcePath = path.resolve(rootDir, "node_modules/eventsource-parser")
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      zod: zodPath,
      "zod/v3": zodPath,
      "zod/v4": zodPath,
      "eventsource-parser/stream": path.join(eventsourcePath, "stream"),
    }
    return config
  },
}

export default nextConfig
