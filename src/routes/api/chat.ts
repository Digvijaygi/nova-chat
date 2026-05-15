import { createFileRoute } from "@tanstack/react-router";

const NO_BS = `STRICT RULES:
- Answer the user's question directly. No preamble, no "sure!", no "great question".
- Never say "as an AI", "I cannot", "I'm just a language model", or add safety disclaimers unless the question is genuinely dangerous.
- No filler like "I hope this helps" or "Let me know if…".
- Reply in the same language the user wrote in (Hindi, Hinglish, English, etc.).
- Be useful first, polite second. Short when possible, detailed when asked.`;

const SYSTEM_PROMPTS: Record<string, string> = {
  fast: `You are dksai. ${NO_BS} Keep answers short and direct. Use markdown only when it helps.`,
  smart: `You are dksai. ${NO_BS} Think carefully, then give a structured, accurate answer in markdown. Show reasoning briefly when useful.`,
  coding: `You are dksai, a senior software engineer. ${NO_BS} Always return production-ready code in fenced blocks with the correct language tag. Brief explanations only when needed.`,
  creative: `You are dksai, a creative writer. ${NO_BS} Write vividly with rich detail and rhythm.`,
  search: `You are dksai with live web search. ${NO_BS} Use the SEARCH RESULTS provided to answer with up-to-date facts. Cite sources INLINE using markdown links like [1](url), [2](url) right after the claim they support. End every answer with a "**Sources**" section listing each numbered link on its own line.`,
};

async function searchWeb(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  try {
    const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; dksai/1.0)",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!r.ok) return [];
    const html = await r.text();
    const out: Array<{ title: string; url: string; snippet: string }> = [];
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
  } catch (e) {
    console.error("searchWeb failed", e);
    return [];
  }
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const {
            messages,
            model = "google/gemini-3-flash-preview",
            mode = "fast",
            temperature,
            customSystem,
          } = (await request.json()) as {
            messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
            model?: string;
            mode?: keyof typeof SYSTEM_PROMPTS;
            temperature?: number;
            customSystem?: string;
          };

          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          if (!LOVABLE_API_KEY) {
            return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const baseSystem = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.fast;
          let system = customSystem?.trim()
            ? `${baseSystem}\n\nADDITIONAL USER INSTRUCTIONS:\n${customSystem.trim()}`
            : baseSystem;

          if (mode === "search") {
            const lastUser = [...messages].reverse().find((m) => m.role === "user");
            if (lastUser?.content) {
              const results = await searchWeb(lastUser.content);
              if (results.length) {
                const block = results
                  .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`)
                  .join("\n\n");
                system = `${system}\n\nSEARCH RESULTS for "${lastUser.content}" (use these as your primary source, cite inline as [n](url)):\n\n${block}`;
              } else {
                system = `${system}\n\n(Web search returned no results — answer from your own knowledge and say so.)`;
              }
            }
          }

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              stream: true,
              ...(typeof temperature === "number" ? { temperature } : {}),
              messages: [{ role: "system", content: system }, ...messages],
            }),
          });

          if (!upstream.ok || !upstream.body) {
            if (upstream.status === 429) {
              return new Response(
                JSON.stringify({ error: "Rate limit reached. Please wait a moment." }),
                { status: 429, headers: { "Content-Type": "application/json" } },
              );
            }
            if (upstream.status === 402) {
              return new Response(
                JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }),
                { status: 402, headers: { "Content-Type": "application/json" } },
              );
            }
            const t = await upstream.text();
            console.error("AI gateway error", upstream.status, t);
            return new Response(JSON.stringify({ error: "AI gateway error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(upstream.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
            },
          });
        } catch (e) {
          console.error("/api/chat error", e);
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});