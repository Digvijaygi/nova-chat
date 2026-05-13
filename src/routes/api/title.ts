import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/title")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { text } = (await request.json()) as { text: string };
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response(JSON.stringify({ title: "" }), { status: 200 });
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: "Generate a 3-5 word title for this conversation. No quotes, no punctuation at end. Reply with only the title." },
                { role: "user", content: String(text).slice(0, 500) },
              ],
            }),
          });
          if (!r.ok) return Response.json({ title: "" });
          const j = await r.json();
          const title = String(j.choices?.[0]?.message?.content ?? "").replace(/["'.\n]/g, "").trim().slice(0, 50);
          return Response.json({ title });
        } catch {
          return Response.json({ title: "" });
        }
      },
    },
  },
});