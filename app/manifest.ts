import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ARC Forge - ARC Raiders Item Database",
    short_name: "ARC Forge",
    description:
      "Complete ARC Raiders item database with crafting trees, recipes, and item information",
    start_url: "/",
    display: "standalone",
    background_color: "#07020b",
    theme_color: "#8b5cf6",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/logo.webp",
        sizes: "any",
        type: "image/webp",
      },
    ],
    categories: ["games", "entertainment", "utilities"],
  };
}
