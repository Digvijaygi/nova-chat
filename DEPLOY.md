# Deploying dksai

This project is **Cloudflare Workers-ready out of the box** (uses `@cloudflare/vite-plugin` + `wrangler.jsonc`). The fastest paths:

## Option 1 — Lovable Publish (recommended, zero config)
1. Click **Publish** in the Lovable editor.
2. App is live at `https://dksai.lovable.app` (your custom domain works in Project Settings → Domains).
3. All secrets (`LOVABLE_API_KEY`, `GROQ_API_KEY`, `GOOGLE_API_KEY`, …) are auto-injected from Lovable Cloud → Secrets.

## Option 2 — Cloudflare Workers (your own account)

```bash
# 1. Install Wrangler + log in once
bun add -d wrangler
bunx wrangler login

# 2. Add every LLM key you want enabled (paste value when prompted)
bunx wrangler secret put LOVABLE_API_KEY
bunx wrangler secret put GROQ_API_KEY
bunx wrangler secret put GOOGLE_API_KEY
bunx wrangler secret put OPENROUTER_API_KEY
bunx wrangler secret put MISTRAL_API_KEY
bunx wrangler secret put XAI_API_KEY
bunx wrangler secret put PERPLEXITY_API_KEY
bunx wrangler secret put DEEPSEEK_API_KEY
bunx wrangler secret put TOGETHER_API_KEY
bunx wrangler secret put FIREWORKS_API_KEY
bunx wrangler secret put CEREBRAS_API_KEY
bunx wrangler secret put SAMBANOVA_API_KEY
bunx wrangler secret put OPENAI_API_KEY
bunx wrangler secret put NVIDIA_API_KEY
bunx wrangler secret put COHERE_API_KEY
# Optional advanced search engines (auto-used in Search mode if present):
bunx wrangler secret put TAVILY_API_KEY
bunx wrangler secret put BRAVE_SEARCH_API_KEY
# (only the providers whose models you actually use are required)

# 3. Build + deploy
bun run build
bunx wrangler deploy
```

That's it. Cloudflare returns a `*.workers.dev` URL or attach your domain in the CF dashboard. SSR, streaming, `/api/public/*` routes — all work natively because the build target is already Cloudflare Workers.

## Where to get API keys (free tiers available)
| Provider     | Get key                                    | Free tier? |
|--------------|--------------------------------------------|------------|
| Groq         | https://console.groq.com/keys              | ✅ generous |
| Google       | https://aistudio.google.com/apikey         | ✅          |
| OpenRouter   | https://openrouter.ai/keys                 | ✅ + credits|
| Mistral      | https://console.mistral.ai/api-keys/       | ✅          |
| xAI Grok     | https://console.x.ai/                      | ✅ trial    |
| Perplexity   | https://www.perplexity.ai/settings/api     | paid        |
| DeepSeek     | https://platform.deepseek.com/api_keys     | paid        |
| Together     | https://api.together.xyz/settings/api-keys | ✅          |
| Fireworks    | https://fireworks.ai/account/api-keys      | ✅          |
| Cerebras     | https://cloud.cerebras.ai/                 | ✅ free     |
| SambaNova    | https://cloud.sambanova.ai/                | ✅          |
| OpenAI       | https://platform.openai.com/api-keys       | paid        |
| NVIDIA NIM   | https://build.nvidia.com/                  | ✅ free credits |
| Cohere       | https://dashboard.cohere.com/api-keys      | ✅ trial    |
| Tavily search| https://app.tavily.com/                    | ✅ 1k/month |
| Brave search | https://api.search.brave.com/              | ✅ 2k/month |

## SEO
`public/robots.txt`, `public/sitemap.xml`, per-route `<head>` meta + JSON-LD, and canonical tags are pre-configured. After deploy, submit your sitemap at Google Search Console: `https://YOUR-DOMAIN/sitemap.xml`.