// Shared provider catalog used by chat / ensemble / agent / providers endpoints.
// Server-only — relies on process.env. Do NOT import from client code.

export interface ProviderInfo {
  url: string;
  envKey: string;
  label: string;
}

export const PROVIDERS: Record<string, ProviderInfo> = {
  // Lovable AI Gateway is implicit (no prefix) — handled by callers.
  groq:         { url: "https://api.groq.com/openai/v1/chat/completions",                          envKey: "GROQ_API_KEY",        label: "Groq" },
  gemini:       { url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",  envKey: "GOOGLE_API_KEY",      label: "Google Gemini" },
  openrouter:   { url: "https://openrouter.ai/api/v1/chat/completions",                            envKey: "OPENROUTER_API_KEY",  label: "OpenRouter" },
  mistral:      { url: "https://api.mistral.ai/v1/chat/completions",                               envKey: "MISTRAL_API_KEY",     label: "Mistral" },
  xai:          { url: "https://api.x.ai/v1/chat/completions",                                     envKey: "XAI_API_KEY",         label: "xAI Grok" },
  perplexity:   { url: "https://api.perplexity.ai/chat/completions",                               envKey: "PERPLEXITY_API_KEY",  label: "Perplexity" },
  together:     { url: "https://api.together.xyz/v1/chat/completions",                             envKey: "TOGETHER_API_KEY",    label: "Together" },
  fireworks:    { url: "https://api.fireworks.ai/inference/v1/chat/completions",                   envKey: "FIREWORKS_API_KEY",   label: "Fireworks" },
  deepseek:     { url: "https://api.deepseek.com/v1/chat/completions",                             envKey: "DEEPSEEK_API_KEY",    label: "DeepSeek" },
  cerebras:     { url: "https://api.cerebras.ai/v1/chat/completions",                              envKey: "CEREBRAS_API_KEY",    label: "Cerebras" },
  sambanova:    { url: "https://api.sambanova.ai/v1/chat/completions",                             envKey: "SAMBANOVA_API_KEY",   label: "SambaNova" },
  openaidirect: { url: "https://api.openai.com/v1/chat/completions",                               envKey: "OPENAI_API_KEY",      label: "OpenAI" },
  nvidia:       { url: "https://integrate.api.nvidia.com/v1/chat/completions",                     envKey: "NVIDIA_API_KEY",      label: "NVIDIA NIM" },
  cohere:       { url: "https://api.cohere.com/compatibility/v1/chat/completions",                 envKey: "COHERE_API_KEY",      label: "Cohere" },
};

export function resolveModel(model: string): { url: string; key: string; upstream: string; label: string; provider: string } | { error: string } {
  const slash = model.indexOf("/");
  const prefix = slash > 0 ? model.slice(0, slash) : "";
  const p = PROVIDERS[prefix];
  if (p) {
    const key = process.env[p.envKey] ?? "";
    if (!key) return { error: `${p.label}: missing ${p.envKey}` };
    return { url: p.url, key, upstream: model.slice(prefix.length + 1), label: p.label, provider: prefix };
  }
  const key = process.env.LOVABLE_API_KEY ?? "";
  if (!key) return { error: "Lovable AI Gateway: missing LOVABLE_API_KEY" };
  return { url: "https://ai.gateway.lovable.dev/v1/chat/completions", key, upstream: model, label: "Lovable AI", provider: "lovable" };
}

/** Get list of provider prefixes that currently have an env key set. Also reports 'lovable'. */
export function availableProviders(): string[] {
  const out: string[] = [];
  if (process.env.LOVABLE_API_KEY) out.push("lovable");
  for (const [prefix, p] of Object.entries(PROVIDERS)) {
    if (process.env[p.envKey]) out.push(prefix);
  }
  return out;
}

/** Non-streaming chat completion. Returns the assistant content or throws. */
export async function callModel(opts: {
  model: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<{ content: string; provider: string; ms: number; model: string }> {
  const r = resolveModel(opts.model);
  if ("error" in r) throw new Error(r.error);
  const t0 = Date.now();
  const resp = await fetch(r.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${r.key}`,
      "Content-Type": "application/json",
      ...(r.provider === "openrouter" ? { "HTTP-Referer": "https://dksai.lovable.app", "X-Title": "dksai" } : {}),
    },
    signal: opts.signal,
    body: JSON.stringify({
      model: r.upstream,
      stream: false,
      ...(typeof opts.temperature === "number" ? { temperature: opts.temperature } : {}),
      messages: opts.messages,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`${r.label} ${resp.status}: ${t.slice(0, 200)}`);
  }
  const j: any = await resp.json();
  const content = j.choices?.[0]?.message?.content ?? "";
  return { content: String(content), provider: r.label, ms: Date.now() - t0, model: opts.model };
}