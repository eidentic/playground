import { getStore, ensureMigrated } from "@/lib/store";
import { sessionScope } from "@/lib/agent";

// Reads stored memory for the panel — no LLM key needed (pure store reads).
export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const sessionId = new URL(req.url).searchParams.get("sessionId")?.trim();
  if (!sessionId) return Response.json({ error: "sessionId required" }, { status: 400 });

  await ensureMigrated();
  const store = getStore();
  const scope = sessionScope(sessionId);

  const [blocks, facts, events] = await Promise.all([
    store.getBlocks(scope).catch(() => []),
    store.queryFacts({ scope }).catch(() => []),
    store.readEvents(sessionId).catch(() => []),
  ]);

  return Response.json({
    blocks,
    facts,
    turns: events.filter((e) => e.kind === "assistant").length,
  });
}
