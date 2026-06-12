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
          <svg width="26" viewBox="0 0 115.5 85.5" fill="none" aria-hidden className="brand-mark">
            <path d="M 67.8 26 A 34 34 0 1 0 67.8 65" stroke="#e8e8ea" strokeWidth="8" strokeLinecap="round" />
            <path d="M 8 45.5 H 106" stroke="#e8e8ea" strokeWidth="8" strokeLinecap="round" />
            <path d="M 106 45.5 V 79.5" stroke="#e8e8ea" strokeWidth="8" strokeLinecap="round" />
            <circle cx="106" cy="9.5" r="7.5" fill="#f5a524" />
          </svg>
          Eidentic <span className="tag">Playground</span>
        </div>
        <div className="topbar-spacer" />
        <a className="ghost" href="https://eidentic.dev" target="_blank" rel="noreferrer">Docs</a>
        <a
          className="ghost"
          href="https://github.com/eidentic/playground"
          target="_blank"
          rel="noreferrer"
          title="View this playground's source on GitHub"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.62 8.2 11.18.6.12.82-.26.82-.58 0-.28-.01-1.04-.02-2.04-3.34.72-4.04-1.6-4.04-1.6-.55-1.38-1.34-1.75-1.34-1.75-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.23 1.84 1.23 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.58-2.67-.3-5.47-1.31-5.47-5.84 0-1.29.47-2.35 1.23-3.18-.12-.3-.53-1.51.12-3.15 0 0 1.01-.32 3.3 1.21a11.5 11.5 0 0 1 6 0c2.29-1.53 3.3-1.21 3.3-1.21.65 1.64.24 2.85.12 3.15.77.83 1.23 1.89 1.23 3.18 0 4.54-2.81 5.54-5.49 5.83.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.7.82.58A12 12 0 0 0 24 12.29C24 5.78 18.63.5 12 .5z" />
          </svg>
          Source
        </a>
        <a
          className="ghost star"
          href="https://github.com/eidentic/eidentic"
          target="_blank"
          rel="noreferrer"
          title="Star Eidentic on GitHub"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2.2l2.92 6.31 6.88.7a.6.6 0 0 1 .34 1.04l-5.13 4.6 1.49 6.76a.6.6 0 0 1-.89.65L12 18.86l-6.11 3.4a.6.6 0 0 1-.89-.65l1.49-6.76-5.13-4.6a.6.6 0 0 1 .34-1.04l6.88-.7L11.5 2.2a.6.6 0 0 1 1.08 0z" />
          </svg>
          Star
        </a>
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
