import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "theSpotlightChurch",
    short_name: "theSpotlightChurch",
    description:
      "theSpotlightChurch — Company of the Blessed. Sermons, community, and giving.",
    start_url: "/",
    display: "standalone",
    background_color: "#081534",
    theme_color: "#081534",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
