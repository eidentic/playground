import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eidentic Playground — memory-backed agent, live",
  description:
    "Try the Eidentic agent SDK live. Chat with an agent that remembers across turns, watch its knowledge graph fill in, and erase it in one call. Bring your own OpenAI/Anthropic key — never stored.",
  metadataBase: new URL("https://playground.eidentic.dev"),
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "Eidentic Playground",
    description: "Memory-backed agent you can try live. Bring your own key.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
