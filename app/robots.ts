import type { MetadataRoute } from "next";

const SITE_URL = "https://try.eidentic.dev";

// Allow everything, including AI answer-engine crawlers (GEO). The single rule below already
// permits every agent; the named entries make our intent explicit and future-proof if we ever
// add disallows.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
        ],
        allow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
