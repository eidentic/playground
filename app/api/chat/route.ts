import { toUIMessageStreamResponse } from "@eidentic/server";
import { buildAgent, type Provider } from "@/lib/agent";
import { ensureMigrated } from "@/lib/store";

// Eidentic needs Node.js APIs — not the edge runtime.
export const runtime = "nodejs";

type UIPart = { type?: string; text?: string };
type UIMessage = { role?: string; content?: string; parts?: UIPart[] };

/** The newest user message's text from a `useChat` history. */
function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m || m.role !== "user") continue;
    if (typeof m.content === "string") return m.content;
    if (Array.isArray(m.parts)) {
      return m.parts
        .filter((p) => p?.type === "text" && typeof p.text === "string")
        .map((p) => p.text as string)
        .join("");
    }
    return "";
  }
  return "";
}

export async function POST(req: Request): Promise<Response> {
  // Bring-your-own-key: the visitor's key arrives in a header, is used to build the model for THIS
  // request, and is never stored or logged.
  const apiKey = req.headers.get("x-llm-key")?.trim();
  const provider = (req.headers.get("x-llm-provider") || "openai") as Provider;
  const model = req.headers.get("x-llm-model")?.trim() || undefined;
  const sessionId = req.headers.get("x-session-id")?.trim() || crypto.randomUUID();

  if (!apiKey) {
    return Response.json(
      { error: "No API key. Add your OpenAI or Anthropic key in the left panel — it's used only for this request and never stored." },
      { status: 401 },
    );
  }

  let input = "";
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    input = lastUserText(body.messages ?? []);
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!input) return Response.json({ error: "Empty message" }, { status: 400 });

  try {
    await ensureMigrated();
    const agent = buildAgent({ provider, apiKey, model });
    // The agent reloads prior turns + memory for this session from the store via the scope.
    // Memory is scoped to the session — `userId === sessionId`, matching `sessionScope()`.
    const events = agent.query(input, { sessionId, userId: sessionId });
    return toUIMessageStreamResponse(events);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Most failures here are a bad/expired key or an unknown model id — surface it plainly.
    return Response.json({ error: message }, { status: 502 });
  }
}
