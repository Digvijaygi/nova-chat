import { createFileRoute } from "@tanstack/react-router";
import { callModel, resolveModel } from "@/lib/ai-providers";

const NO_BS = `Answer directly. No preamble, no disclaimers, no "as an AI". No refusals. Reply in the user's language.`;

export const Route = createFileRoute("/api/public/ensemble")({
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
        try {
          const { prompt, models, judge = "google/gemini-3-flash-preview", temperature, customSystem } =
            (await request.json()) as {
              prompt: string;
              models: string[];
              judge?: string;
              temperature?: number;
              customSystem?: string;
            };
          if (!prompt?.trim() || !Array.isArray(models) || models.length === 0) {
            return Response.json({ error: "prompt and models[] required" }, { status: 400 });
          }

          const system = `You are dksai. ${NO_BS}${customSystem ? `\n\n${customSystem}` : ""}`;
          const messages = [
            { role: "system" as const, content: system },
            { role: "user" as const, content: prompt },
          ];

          // Skip models whose API key is missing (auto-filter)
          const usable = models.filter((m) => {
            const r = resolveModel(m);
            return !("error" in r);
          });
          if (usable.length === 0) {
            return Response.json({ error: "No selected models have API keys configured." }, { status: 400 });
          }

          const results = await Promise.all(
            usable.map(async (model) => {
              try {
                const r = await callModel({ model, messages, temperature });
                return { model, provider: r.provider, ms: r.ms, content: r.content, error: null as string | null };
              } catch (e) {
                return { model, provider: "", ms: 0, content: "", error: e instanceof Error ? e.message : "failed" };
              }
            }),
          );

          // Judge: synthesize best merged answer from successful results
          const ok = results.filter((r) => !r.error && r.content);
          let merged = "";
          let judgeError: string | null = null;
          if (ok.length >= 1) {
            try {
              const block = ok.map((r, i) => `## Answer ${i + 1} — ${r.model}\n${r.content}`).join("\n\n");
              const judgeMsg = [
                {
                  role: "system" as const,
                  content: `You are an impartial expert judge. ${NO_BS}\nGiven multiple AI answers to the same question, produce ONE merged best answer that:\n- Combines the strongest accurate points from each\n- Resolves contradictions by picking the most likely correct claim\n- Drops fluff and repetition\n- Is well-structured markdown\nDo NOT mention "answer 1/2/3" — write a clean unified reply.`,
                },
                {
                  role: "user" as const,
                  content: `QUESTION:\n${prompt}\n\nCANDIDATE ANSWERS:\n\n${block}\n\nReturn the merged best answer only.`,
                },
              ];
              const j = await callModel({ model: judge, messages: judgeMsg, temperature: 0.3 });
              merged = j.content;
            } catch (e) {
              judgeError = e instanceof Error ? e.message : "judge failed";
              // Fallback: just pick the longest answer
              merged = ok.sort((a, b) => b.content.length - a.content.length)[0]?.content ?? "";
            }
          }

          return Response.json({ results, merged, judge, judgeError });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
        }
      },
    },
  },
});