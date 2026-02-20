/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Use explicit paths as recommended in the Tailwind docs
    "./**/*.{js,jsx,ts,tsx}",
    "./**/*.mdx",
    // Add explicit source extensions
    "./**/*.html",
    "./**/*.css",
    // Include specific directories that might contain Tailwind classes
    "./brand-overview/**/*.{js,jsx,ts,tsx,mdx}",
    "./developer-resources/**/*.{js,jsx,ts,tsx,mdx}",
    "./mintlify-docs/**/*.{js,jsx,ts,tsx,mdx}",
    "./platform-services/**/*.{js,jsx,ts,tsx,mdx}",
    "./product-catalog/**/*.{js,jsx,ts,tsx,mdx}",
    "./roadmap-planning/**/*.{js,jsx,ts,tsx,mdx}",
    "./snippets/**/*.{js,jsx,ts,tsx,mdx}",
    "./technology-stack/**/*.{js,jsx,ts,tsx,mdx}",
    "./agents/**/*.{js,jsx,ts,tsx,mdx}",
    // Components and layouts
    "./components/**/*.{js,jsx,ts,tsx}",
    "./layouts/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Add source detection to ensure Tailwind scans the appropriate files
  source: {
    base: ".",
    files: [
      "./**/*.mdx",
      "./**/*.{js,jsx,ts,tsx}",
    ],
  },
}