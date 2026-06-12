import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://try.eidentic.dev";
const TITLE = "Eidentic Playground — a memory-backed AI agent you can try live";
const DESCRIPTION =
  "Chat with an AI agent that remembers you across turns. Watch its temporal knowledge graph fill in live, inspect the memory blocks it writes, and erase everything in one call. Built on Eidentic, the open-source TypeScript SDK for agents with self-improving memory. Bring your own OpenAI or Anthropic key — it never leaves your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Eidentic Playground",
  keywords: [
    "Eidentic",
    "AI agent",
    "agent memory",
    "TypeScript AI SDK",
    "LLM memory",
    "knowledge graph",
    "temporal knowledge graph",
    "agent SDK",
    "OpenAI",
    "Anthropic",
    "Vercel AI SDK",
    "self-improving memory",
    "long-term memory",
    "RAG alternative",
    "playground",
  ],
  authors: [{ name: "Eidentic", url: "https://eidentic.dev" }],
  creator: "Eidentic",
  publisher: "Eidentic",
  category: "technology",
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Eidentic Playground",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "An AI agent that remembers you across turns — watch its knowledge graph fill in live. Open-source, bring your own key.",
    site: "@eidentic",
    creator: "@eidentic",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1117",
  colorScheme: "dark",
};

// JSON-LD structured data — the primary signal for search engines and AI answer engines
// (GEO). Describes the playground as a free WebApplication that is part of the Eidentic SDK,
// published by the Eidentic organization, with canonical links out to docs / repo / npm.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: "Eidentic Playground",
      url: SITE_URL,
      description: DESCRIPTION,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web)",
      browserRequirements: "Requires JavaScript and a modern browser",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      isPartOf: { "@id": "https://eidentic.dev/#software" },
      publisher: { "@id": "https://eidentic.dev/#org" },
      featureList: [
        "Cross-session agent memory",
        "Live temporal knowledge graph",
        "Editable memory blocks",
        "One-call right-to-erasure (GDPR)",
        "Bring-your-own-key (OpenAI / Anthropic)",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://eidentic.dev/#software",
      name: "Eidentic",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Node.js, Bun, Deno, Edge",
      description:
        "Open-source TypeScript SDK for building AI agents with self-improving, cross-session memory backed by a temporal knowledge graph.",
      url: "https://eidentic.dev",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      softwareHelp: "https://eidentic.dev",
      sameAs: [
        "https://github.com/eidentic/eidentic",
        "https://www.npmjs.com/package/eidentic",
      ],
    },
    {
      "@type": "Organization",
      "@id": "https://eidentic.dev/#org",
      name: "Eidentic",
      url: "https://eidentic.dev",
      logo: `${SITE_URL}/icon.svg`,
      sameAs: [
        "https://github.com/eidentic",
        "https://www.npmjs.com/package/eidentic",
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          // Structured data must be a raw JSON string in the DOM.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
