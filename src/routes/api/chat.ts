import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPTS: Record<string, string> = {
  fast: "You are dksai, a friendly, concise AI assistant. Give clear, direct answers. Use markdown when helpful.",
  smart: "You are dksai, a thoughtful AI assistant. Reason carefully step by step, then give a well-structured, accurate answer in markdown. Cite assumptions explicitly.",
  coding: "You are dksai, an expert senior software engineer. Always respond with clean, production-ready code in fenced code blocks with the correct language tag. Explain key decisions briefly. Prefer modern best practices.",
  creative: "You are dksai, an imaginative creative collaborator. Write vividly, with rich detail, metaphor, and rhythm. Use markdown for structure when useful.",
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages, model = "google/gemini-3-flash-preview", mode = "fast" } =
            (await request.json()) as {
              messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
              model?: string;
              mode?: keyof typeof SYSTEM_PROMPTS;
            };

          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          if (!LOVABLE_API_KEY) {
            return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const system = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.fast;

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              stream: true,
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