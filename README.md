# Eidentic Playground

A live demo of the [Eidentic](https://github.com/eidentic/eidentic) agent SDK: chat with an agent
that **remembers across turns**, watch its **temporal knowledge graph** fill in as you talk, and
**erase it all in one call**. Built on `@eidentic/nextjs` + the Vercel AI SDK (`useChat`), deployable
to Vercel in a click.

**Bring your own key.** Each visitor enters their own OpenAI or Anthropic key. The key lives in
*your browser* (localStorage), is sent only with your own requests, and is **never stored or logged**
server-side — this repo is public so you can verify exactly that (`app/api/chat/route.ts`).

## What it shows

- **Memory that persists** — the agent recalls earlier turns and durable facts (`@eidentic/memory` + `@eidentic/libsql`).
- **Temporal knowledge graph** — facts the agent extracts from the conversation, shown live (passive, rule-based extraction — no extra LLM calls).
- **One-call right-to-erasure** — "Erase memory" fans out a single `eraseScope()` across sessions, the event log, blocks, the lexical index, and the graph (GDPR §15).
- **Per-session isolation** — every browser session is isolated by `scopeKey`, so one database safely serves everyone.

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000
```

Memory persists to a local `./playground.db` (SQLite) — no setup needed. Open the app and paste your
own API key.

## Deploy (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/eidentic/playground)

The serverless filesystem is ephemeral, so set a remote libSQL/[Turso](https://turso.tech) database
(free tier) for memory to persist between requests:

| Env var | Value |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | your Turso token |

No LLM key env var — the playground is bring-your-own-key by design.

## How it works

- `app/api/chat/route.ts` — reads the visitor's key/provider/model from request headers, builds a
  per-request `Agent` with that model, and streams the reply with `toUIMessageStreamResponse` (the
  format `useChat` consumes). The key is used only for that request.
- `lib/agent.ts` — constructs the agent with `Memory({ graph, extraction: "passive" })`, scoped to
  the session.
- `lib/store.ts` — one shared `LibsqlStore`; scope isolation keeps sessions separate.
- `app/api/memory/route.ts` / `reset/route.ts` — read the live memory state / erase a session.

Apache-2.0.
