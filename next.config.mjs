import { spawnSync } from "node:child_process"
import withSerwistInit from "@serwist/next"

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/verse/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://*.myshopify.com https://*.moodmnky.com https://moodmnky.com",
          },
        ],
      },
    ]
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, "react-native-fs": false }
    return config
  },
  experimental: {
    middlewareClientMaxBodySize: "60mb",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
    loader: "custom",
    loaderFile: "./lib/supabase-image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/render/image/public/**",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.myshopify.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s3.us-west-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.notion.so",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.notion.site",
        pathname: "/**",
      },
    ],
  },
}

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ??
  crypto.randomUUID()

const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [
    { url: "/~offline", revision },
    { url: "/verse", revision },
  ],
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
})

export default withSerwist(nextConfig)
