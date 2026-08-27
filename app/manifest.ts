import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ugenya Association Eldoret",
    short_name: "UAE Portal",
    description:
      "Community savings and welfare management for Ugenya Association Eldoret",
    start_url: "/",
    display: "standalone",
    background_color: "#eef2ff",
    theme_color: "#1d3a8a",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        // The Web App Manifest spec allows a space-separated purpose value
        // ("any maskable") so one icon serves both roles, but Next's Manifest
        // type only models a single keyword. Cast around that gap - the
        // runtime output is unaffected, only the TS check.
        purpose: "any maskable" as unknown as "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable" as unknown as "any",
      },
    ],
  };
}
