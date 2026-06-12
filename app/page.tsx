"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

type Provider = "openai" | "anthropic";
type MemoryBlock = { label: string; value: string; version: number; updatedAt: string };
type Fact = { subject: string; predicate: string; object: string; validFrom?: string };
type MemoryState = { blocks: MemoryBlock[]; facts: Fact[]; turns: number };

const KEY_HINT: Record<Provider, { label: string; href: string; placeholder: string }> = {
  openai: { label: "OpenAI", href: "https://platform.openai.com/api-keys", placeholder: "sk-..." },
  anthropic: { label: "Anthropic", href: "https://console.anthropic.com/settings/keys", placeholder: "sk-ant-..." },
};
const DEFAULT_MODEL: Record<Provider, string> = { openai: "gpt-4o-mini", anthropic: "claude-3-5-haiku-latest" };

const EXAMPLES = [
  "Hi! My name is Ada and I prefer email over phone.",
  "I'm migrating a Postgres app to Convex this quarter.",
  "What do you remember about me?",
];

function uid(): string {
  return (globalThis.crypto?.randomUUID?.() ?? `s_${Math.random().toString(36).slice(2)}_${Date.now()}`);
}
function load(k: string, fallback = ""): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(k) ?? fallback;
}

export default function Playground() {
  const [provider, setProvider] = useState<Provider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [memory, setMemory] = useState<MemoryState>({ blocks: [], facts: [], turns: 0 });
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Hydrate BYOK config + session from localStorage on the client only.
  useEffect(() => {
    setProvider((load("pg:provider", "openai") as Provider) || "openai");
    setApiKey(load("pg:key"));
    setModel(load("pg:model"));
    let s = load("pg:session");
    if (!s) { s = uid(); window.localStorage.setItem("pg:session", s); }
    setSessionId(s);
  }, []);

  // Persist + keep a ref so the (stable) transport headers always read the latest values.
  const cfg = useRef({ provider, apiKey, model, sessionId });
  useEffect(() => {
    cfg.current = { provider, apiKey, model, sessionId };
    if (typeof window === "undefined") return;
    window.localStorage.setItem("pg:provider", provider);
    window.localStorage.setItem("pg:key", apiKey);
    window.localStorage.setItem("pg:model", model);
  }, [provider, apiKey, model, sessionId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: () => {
          const c = cfg.current;
          return {
            "x-llm-provider": c.provider,
            "x-llm-key": c.apiKey,
            "x-llm-model": c.model,
            "x-session-id": c.sessionId,
          };
        },
      }),
    [],
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({ transport });
  const busy = status === "streaming" || status === "submitted";

  // Refresh the memory inspector after each turn settles.
  const refreshMemory = useMemo(
    () => async (sid: string) => {
      if (!sid) return;
      try {
        const r = await fetch(`/api/memory?sessionId=${encodeURIComponent(sid)}`);
        if (r.ok) setMemory(await r.json());
      } catch {
        /* panel is best-effort */
      }
    },
    [],
  );
  useEffect(() => {
    if (status === "ready" && sessionId) void refreshMemory(sessionId);
  }, [status, sessionId, refreshMemory]);
  useEffect(() => {
    if (sessionId) void refreshMemory(sessionId);
  }, [sessionId, refreshMemory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    if (!apiKey.trim()) return;
    setInput("");
    void sendMessage({ text: t });
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); }
  };

  const erase = async () => {
    if (!sessionId || busy) return;
    await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});
    setMessages([]);
    setMemory({ blocks: [], facts: [], turns: 0 });
  };

  const text = (m: { parts?: { type?: string; text?: string }[] }) =>
    (m.parts ?? []).filter((p) => p?.type === "text").map((p) => p.text).join("");

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">ei</span> Eidentic <span className="tag">Playground</span>
        </div>
        <div className="topbar-spacer" />
        <a className="ghost" href="https://eidentic.dev" target="_blank" rel="noreferrer">Docs</a>
        <a className="ghost" href="https://github.com/eidentic/eidentic" target="_blank" rel="noreferrer">GitHub</a>
      </header>

      <div className="cols">
        {/* ── Left rail: BYOK + session ──────────────────────────────── */}
        <aside className="rail">
          <p className="panel-label">API key (your own)</p>
          <div className="card">
            <div className="field">
              <label>Provider</label>
              <select className="select" value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>
            <div className="field">
              <label>{KEY_HINT[provider].label} API key</label>
              <input
                className="input mono"
                type="password"
                value={apiKey}
                placeholder={KEY_HINT[provider].placeholder}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label>Model <span style={{ color: "var(--text-faint)" }}>(optional)</span></label>
              <input
                className="input mono"
                value={model}
                placeholder={DEFAULT_MODEL[provider]}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
            <p className="hint">
              Your key stays in <strong>your browser</strong> and is sent only with your own requests —
              never stored or logged on the server. This repo is{" "}
              <a href="https://github.com/eidentic/playground" target="_blank" rel="noreferrer">open source</a>,
              so you can verify it. <a href={KEY_HINT[provider].href} target="_blank" rel="noreferrer">Get a key →</a>
            </p>
            <div className="statusrow">
              <span className={`dot ${apiKey.trim() ? "ok" : ""}`} />
              {apiKey.trim() ? "Key set — start chatting" : "Add a key to begin"}
            </div>
          </div>

          <p className="panel-label">Session</p>
          <div className="card">
            <p className="hint" style={{ marginTop: 0 }}>
              The agent persists memory for this session. Erase it to demo Eidentic&apos;s one-call,
              fan-out-everywhere right-to-erasure (GDPR §15).
            </p>
            <button className="btn danger" onClick={erase} disabled={busy}>Erase memory</button>
          </div>
        </aside>

        {/* ── Center: chat ──────────────────────────────────────────── */}
        <main className="center">
          <div className="chat">
            {error && <div className="banner">{error.message || "Something went wrong. Check your API key/model."}</div>}
            {messages.length === 0 ? (
              <div className="empty">
                <h2>Chat with an agent that remembers</h2>
                <p>Tell it about yourself, then ask what it knows. Watch the knowledge graph fill in on the right.</p>
                <div className="examples">
                  {EXAMPLES.map((ex) => (
                    <button key={ex} className="chip" onClick={() => submit(ex)} disabled={!apiKey.trim() || busy}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chat-inner">
                {messages.map((m) => {
                  const body = text(m);
                  if (!body && m.role === "assistant") return null;
                  return (
                    <div key={m.id} className={`msg ${m.role}`}>
                      <span className="who">{m.role === "user" ? "You" : "Agent"}</span>
                      <div className="bubble">{body}</div>
                    </div>
                  );
                })}
                {busy && (
                  <div className="msg assistant">
                    <span className="who">Agent</span>
                    <div className="thinking">
                      <span className="pulse"><span /><span /><span /></span> thinking
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="composer">
            <div className="composer-inner">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder={apiKey.trim() ? "Message the agent…  (Shift+Enter for newline)" : "Add your API key on the left to start"}
                disabled={!apiKey.trim() || busy}
              />
              <button className="send" onClick={() => submit(input)} disabled={!input.trim() || !apiKey.trim() || busy}>
                Send
              </button>
            </div>
          </div>
        </main>

        {/* ── Right rail: memory inspector ──────────────────────────── */}
        <aside className="rail right">
          <p className="panel-label">Memory · live</p>
          <div className="mem-stat">
            <div className="box"><div className="num">{memory.turns}</div><div className="lbl">turns</div></div>
            <div className="box"><div className="num">{memory.facts.length}</div><div className="lbl">facts</div></div>
            <div className="box"><div className="num">{memory.blocks.length}</div><div className="lbl">blocks</div></div>
          </div>

          <p className="panel-label">Knowledge graph</p>
          {memory.facts.length === 0 ? (
            <p className="mem-empty">No facts yet. Tell the agent something durable about yourself — facts are
              extracted as you chat, with validity over time.</p>
          ) : (
            memory.facts.slice(0, 30).map((f, i) => (
              <div className="fact" key={i}>
                <div className="triple">
                  <strong>{f.subject}</strong><span className="pred">{f.predicate}</span>{f.object}
                </div>
              </div>
            ))
          )}

          {memory.blocks.length > 0 && (
            <>
              <p className="panel-label" style={{ marginTop: 18 }}>Memory blocks</p>
              {memory.blocks.map((b) => (
                <div className="block" key={b.label}>
                  <div className="blabel">{b.label}</div>
                  <div className="bval">{b.value}</div>
                </div>
              ))}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
