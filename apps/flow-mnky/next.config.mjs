/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Opt the app into Turbopack explicitly and configure its resolver there
  turbopack: {
    resolveAlias: {
      // Ensure all zod imports (including subpaths) resolve to the installed zod
      zod: "zod",
      "zod/v3": "zod",
      "zod/v4": "zod",
      // Some AI/streaming helpers import the stream subpath; map it to the main entry
      "eventsource-parser/stream": "eventsource-parser",
    },
  },
}

export default nextConfig
