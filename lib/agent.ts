import { Agent, AIModel } from "eidentic";
import { Memory } from "@eidentic/memory";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { Scope } from "eidentic";
import { getStore } from "./store";

export type Provider = "openai" | "anthropic";

export const AGENT_ID = "playground-agent";

/** Sensible cheap defaults per provider; the UI can override the exact model id. */
export const DEFAULT_MODEL: Record<Provider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-latest",
};

const INSTRUCTIONS = [
  "You are Eidentic's playground assistant.",
  "You have persistent, self-improving memory across the conversation: remember the durable facts a",
  "user shares — their name, role, preferences, the decisions they make — and recall them naturally",
  "in later turns. When asked about something said earlier, answer from memory; if you genuinely",
  "don't know, say so plainly. Keep replies concise and friendly.",
].join(" ");

/** The memory scope for a browser session — isolates every visitor's data via `scopeKey`. */
export function sessionScope(sessionId: string): Scope {
  return { kind: "user", agentId: AGENT_ID, userId: sessionId };
}

/**
 * Build a per-request agent using the visitor's own API key. The key is used only to construct the
 * AI SDK provider for this request — it is never stored or logged. The store + memory are shared
 * (scope-isolated per session). A passive temporal knowledge graph extracts facts rule-based, with
 * no extra LLM calls, so the memory panel fills in even on the cheapest model.
 */
export function buildAgent(opts: { provider: Provider; apiKey: string; model?: string }): Agent {
  const store = getStore();
  const memory = new Memory({ store, graph: store, extraction: "passive" });

  const modelId = opts.model || DEFAULT_MODEL[opts.provider];
  const languageModel =
    opts.provider === "anthropic"
      ? createAnthropic({ apiKey: opts.apiKey })(modelId)
      : createOpenAI({ apiKey: opts.apiKey })(modelId);

  return new Agent({
    id: AGENT_ID,
    instructions: INSTRUCTIONS,
    model: new AIModel(languageModel),
    store,
    memory,
  });
}
