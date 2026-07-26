import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CivicLens AI",
    short_name: "CivicLens",
    description: "Explainable urban hazard detection and geospatial reporting platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#07101f",
    theme_color: "#07101f",
    orientation: "any",
    categories: ["productivity", "utilities", "government"],
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}
