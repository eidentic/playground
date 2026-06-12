import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eidentic Playground",
    short_name: "Eidentic",
    description:
      "Chat with an AI agent that remembers you across turns, watch its knowledge graph fill in live, and erase it in one call. Bring your own key.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1117",
    theme_color: "#0f1117",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
    ],
  };
}
