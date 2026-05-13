import type { Message } from "./chat-store";

export interface StreamOptions {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  model: string;
  mode: string;
  temperature?: number;
  customSystem?: string;
  signal?: AbortSignal;
  onDelta: (chunk: string) => void;
}

export async function streamChat(opts: StreamOptions) {
  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: opts.messages,
      model: opts.model,
      mode: opts.mode,
      temperature: opts.temperature,
      customSystem: opts.customSystem,
    }),
    signal: opts.signal,
  });

  if (!resp.ok || !resp.body) {
    let msg = `Request failed (${resp.status})`;
    try {
      const j = await resp.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line || line.startsWith(":")) continue;
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") {
        done = true;
        break;
      }
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) opts.onDelta(delta);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
}

export type { Message };