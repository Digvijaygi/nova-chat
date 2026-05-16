import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { prompt } = (await request.json()) as { prompt: string };
          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
              status: 500, headers: { "Content-Type": "application/json" },
            });
          }
          if (!prompt || typeof prompt !== "string") {
            return new Response(JSON.stringify({ error: "prompt is required" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            });
          }
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
            }),
          });
          if (!r.ok) {
            if (r.status === 429) return Response.json({ error: "Rate limit reached" }, { status: 429 });
            if (r.status === 402) return Response.json({ error: "AI credits exhausted" }, { status: 402 });
            const t = await r.text();
            console.error("image gen error", r.status, t);
            return Response.json({ error: "Image generation failed" }, { status: 500 });
          }
          const j = await r.json();
          const msg = j.choices?.[0]?.message;
          const url: string | undefined =
            msg?.images?.[0]?.image_url?.url ?? msg?.images?.[0]?.url;
          if (!url) return Response.json({ error: "No image returned" }, { status: 500 });
          return Response.json({ url });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
        }
      },
    },
  },
});