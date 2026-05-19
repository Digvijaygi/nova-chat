import { createFileRoute } from "@tanstack/react-router";
import { PROVIDERS, availableProviders } from "@/lib/ai-providers";

export const Route = createFileRoute("/api/public/providers")({
  server: {
    handlers: {
      GET: async () => {
        const available = availableProviders();
        const list = [
          { id: "lovable", label: "Lovable AI Gateway", envKey: "LOVABLE_API_KEY", available: available.includes("lovable") },
          ...Object.entries(PROVIDERS).map(([id, p]) => ({
            id, label: p.label, envKey: p.envKey, available: available.includes(id),
          })),
        ];
        return Response.json({ providers: list, available });
      },
    },
  },
});