import { getStore, ensureMigrated } from "@/lib/store";
import { sessionScope } from "@/lib/agent";

// Demonstrates Eidentic's one-call right-to-erasure (§15): wipe ALL data for a session's scope —
// sessions, the event log, memory blocks, the lexical index, and knowledge-graph facts.
export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  let sessionId = "";
  try {
    sessionId = ((await req.json()) as { sessionId?: string }).sessionId?.trim() ?? "";
  } catch {
    /* fall through to the 400 below */
  }
  if (!sessionId) return Response.json({ error: "sessionId required" }, { status: 400 });

  await ensureMigrated();
  const { deleted } = await getStore().eraseScope(sessionScope(sessionId));
  return Response.json({ ok: true, deleted });
}
