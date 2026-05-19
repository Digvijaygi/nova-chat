import { createFileRoute } from "@tanstack/react-router";
import { callModel, resolveModel } from "@/lib/ai-providers";

// --- minimal search + fetch (DuckDuckGo HTML + Tavily/Brave if keys) ---

type Hit = { title: string; url: string; snippet: string };

async function ddg(q: string): Promise<Hit[]> {
  try {
    const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
      headers: { "User-Agent": "Mozilla/5.0 dksai-agent", "Accept-Language": "en-US,en;q=0.9" },
    });
    if (!r.ok) return [];
    const html = await r.text();
    const out: Hit[] = [];
    const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) && out.length < 6) {
      let href = m[1];
      const uddg = href.match(/uddg=([^&]+)/);
      if (uddg) href = decodeURIComponent(uddg[1]);
      if (href.startsWith("//")) href = "https:" + href;
      const title = m[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
      const snippet = m[3].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
      if (/^https?:\/\//.test(href) && title) out.push({ title, url: href, snippet });
    }
    return out;
  } catch { return []; }
}

async function tavily(q: string): Promise<Hit[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];
  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key, query: q, search_depth: "advanced", max_results: 6 }),
    });
    if (!r.ok) return [];
    const j: any = await r.json();
    return (j.results ?? []).map((x: any) => ({ title: x.title, url: x.url, snippet: x.content ?? "" }));
  } catch { return []; }
}

async function search(q: string): Promise<Hit[]> {
  const t = await tavily(q);
  if (t.length) return t;
  return ddg(q);
}

async function fetchExcerpt(url: string): Promise<string> {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 dksai-agent" } });
    clearTimeout(to);
    if (!r.ok) return "";
    const ct = r.headers.get("content-type") ?? "";
    if (!ct.includes("text") && !ct.includes("html")) return "";
    const html = (await r.text()).slice(0, 250_000);
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
      .replace(/\s+/g, " ").trim().slice(0, 2500);
  } catch { return ""; }
}

// ---------------- agent loop ----------------

interface PlanStep { id: number; title: string; query?: string; type: "search" | "fetch" | "think" | "summarize" }

export const Route = createFileRoute("/api/public/agent")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }),
      POST: async ({ request }) => {
        const { task, model = "google/gemini-3-flash-preview" } = (await request.json()) as { task: string; model?: string };
        if (!task?.trim()) return Response.json({ error: "task required" }, { status: 400 });

        const r = resolveModel(model);
        if ("error" in r) return Response.json({ error: r.error }, { status: 400 });

        const stream = new ReadableStream({
          async start(ctrl) {
            const enc = new TextEncoder();
            const send = (obj: unknown) => ctrl.enqueue(enc.encode(JSON.stringify(obj) + "\n"));

            try {
              send({ type: "log", text: `🤖 Agent online — task: "${task}"` });
              send({ type: "log", text: `🧠 Planner model: ${model}` });

              // 1) Plan
              send({ type: "step", id: 0, title: "Plan the workflow", status: "running" });
              let plan: PlanStep[] = [];
              try {
                const planResp = await callModel({
                  model,
                  temperature: 0.2,
                  messages: [
                    {
                      role: "system",
                      content: `You are an autonomous research/browser agent. Break the user task into 3-5 concrete steps. Return ONLY valid JSON:
{"steps":[{"id":1,"type":"search","title":"...","query":"..."},{"id":2,"type":"fetch","title":"..."},{"id":3,"type":"think","title":"..."},{"id":4,"type":"summarize","title":"Compose final answer"}]}
Rules: first step should usually be 'search', last step MUST be 'summarize'. Use 'fetch' to read full pages of best results. Use 'think' for analysis steps. Keep titles under 60 chars.`,
                    },
                    { role: "user", content: task },
                  ],
                });
                const m = planResp.content.match(/\{[\s\S]*\}/);
                if (m) plan = JSON.parse(m[0]).steps as PlanStep[];
              } catch (e) {
                send({ type: "log", text: `⚠️ Planner failed: ${e instanceof Error ? e.message : "err"}. Using default plan.` });
              }
              if (!plan.length) {
                plan = [
                  { id: 1, type: "search", title: "Search the web", query: task },
                  { id: 2, type: "fetch", title: "Read top results" },
                  { id: 3, type: "summarize", title: "Compose final answer" },
                ];
              }
              send({ type: "step", id: 0, title: "Plan the workflow", status: "done", detail: `${plan.length} steps planned` });
              send({ type: "plan", steps: plan });

              // 2) Execute
              const evidence: Array<{ url: string; title: string; snippet: string; excerpt?: string }> = [];

              for (const step of plan) {
                send({ type: "step", id: step.id, title: step.title, status: "running" });
                try {
                  if (step.type === "search") {
                    const q = step.query || task;
                    send({ type: "log", text: `🔎 Searching: "${q}"` });
                    const hits = await search(q);
                    send({ type: "log", text: `  → ${hits.length} results` });
                    for (const h of hits.slice(0, 5)) {
                      send({ type: "log", text: `  • ${h.title} — ${new URL(h.url).hostname}` });
                      evidence.push({ url: h.url, title: h.title, snippet: h.snippet });
                    }
                    send({ type: "step", id: step.id, title: step.title, status: "done", detail: `${hits.length} results` });
                  } else if (step.type === "fetch") {
                    const targets = evidence.slice(0, 3);
                    if (targets.length === 0) {
                      send({ type: "log", text: "  (no targets to fetch — skipping)" });
                    } else {
                      for (const t of targets) {
                        send({ type: "log", text: `📄 Fetching: ${new URL(t.url).hostname}` });
                        const ex = await fetchExcerpt(t.url);
                        t.excerpt = ex;
                        send({ type: "log", text: `  → ${ex.length} chars extracted` });
                      }
                    }
                    send({ type: "step", id: step.id, title: step.title, status: "done", detail: `${targets.length} pages` });
                  } else if (step.type === "think") {
                    send({ type: "log", text: "💭 Reasoning over evidence…" });
                    const thought = await callModel({
                      model, temperature: 0.4,
                      messages: [
                        { role: "system", content: "You are an analyst. In 3-5 bullet points, extract the key insights relevant to the task from the evidence. Be concrete." },
                        { role: "user", content: `TASK: ${task}\n\nEVIDENCE:\n${evidence.slice(0, 5).map((e, i) => `[${i + 1}] ${e.title}\n${e.excerpt || e.snippet}`).join("\n\n")}` },
                      ],
                    });
                    for (const line of thought.content.split("\n").filter(Boolean).slice(0, 8)) {
                      send({ type: "log", text: `  ${line.trim()}` });
                    }
                    send({ type: "step", id: step.id, title: step.title, status: "done" });
                  } else if (step.type === "summarize") {
                    send({ type: "log", text: "✨ Composing final answer…" });
                    const final = await callModel({
                      model, temperature: 0.5,
                      messages: [
                        {
                          role: "system",
                          content: `You are dksai. Write a thorough, well-structured final answer to the user's task in markdown. Use headings, bullets, code blocks where useful. Cite sources inline as [n](url). End with a **Sources** section listing each numbered link. No filler, no disclaimers. Answer in the user's language.`,
                        },
                        {
                          role: "user",
                          content: `TASK:\n${task}\n\nEVIDENCE:\n${evidence.map((e, i) => `[${i + 1}] ${e.title}\nURL: ${e.url}\n${e.excerpt || e.snippet}`).join("\n\n")}`,
                        },
                      ],
                    });
                    send({ type: "step", id: step.id, title: step.title, status: "done" });
                    send({ type: "result", content: final.content, sources: evidence.map((e) => ({ title: e.title, url: e.url })) });
                  }
                } catch (e) {
                  send({ type: "log", text: `❌ Step failed: ${e instanceof Error ? e.message : "err"}` });
                  send({ type: "step", id: step.id, title: step.title, status: "error", detail: e instanceof Error ? e.message : "error" });
                }
              }

              send({ type: "done" });
            } catch (e) {
              send({ type: "log", text: `Fatal: ${e instanceof Error ? e.message : "err"}` });
            } finally {
              ctrl.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});