import type { MetadataRoute } from "next";

/**
 * Installable: from the home screen the game owns the whole screen in
 * portrait, which is the only full screen an iPhone offers a web game.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Breeq",
    short_name: "Breeq",
    description: "A brick breaker built by players, for players.",
    start_url: "/play",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#05060c",
    theme_color: "#05060c",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
