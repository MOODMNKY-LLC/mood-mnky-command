import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MOOD MNKY LABZ",
    short_name: "MNKY",
    description:
      "Formula calculator, fragrance oil catalog, product builder, and MNKY VERSE storefront for MOOD MNKY",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f1f5f9",
    theme_color: "#f1f5f9",
    categories: ["shopping", "lifestyle", "utilities"],
    icons: [
      {
        src: "/icons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/icons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        label: "MOOD MNKY",
        form_factor: "wide",
      },
      {
        src: "/icons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        label: "MOOD MNKY",
        form_factor: "narrow",
      },
    ],
  }
}
