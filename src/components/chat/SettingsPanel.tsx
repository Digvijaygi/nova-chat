import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const MODELS = [
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash — Fast" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro — Smart" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash — Balanced" },
  { id: "openai/gpt-5", name: "GPT-5 — Powerful" },
  { id: "openai/gpt-5-mini", name: "GPT-5 mini — Quick" },
  { id: "openai/gpt-5-nano", name: "GPT-5 nano — Ultra fast" },
  // ===== Direct providers (your own API keys, stored as backend secrets) =====
  // Groq
  { id: "groq/llama-3.3-70b-versatile", name: "Groq · Llama 3.3 70B — Blazing fast" },
  { id: "groq/llama-3.1-8b-instant", name: "Groq · Llama 3.1 8B — Instant" },
  { id: "groq/mixtral-8x7b-32768", name: "Groq · Mixtral 8x7B" },
  { id: "groq/deepseek-r1-distill-llama-70b", name: "Groq · DeepSeek R1 70B — Reasoning" },
  { id: "groq/llama-3.2-90b-vision-preview", name: "Groq · Llama 3.2 90B Vision" },
  // Google (own key)
  { id: "gemini/gemini-2.0-flash", name: "Google · Gemini 2.0 Flash (own key)" },
  { id: "gemini/gemini-1.5-pro", name: "Google · Gemini 1.5 Pro (own key)" },
  { id: "gemini/gemini-1.5-flash", name: "Google · Gemini 1.5 Flash (own key)" },
  // OpenRouter (gateway to 200+ models)
  { id: "openrouter/anthropic/claude-3.5-sonnet", name: "OpenRouter · Claude 3.5 Sonnet" },
  { id: "openrouter/anthropic/claude-3.5-haiku", name: "OpenRouter · Claude 3.5 Haiku" },
  { id: "openrouter/meta-llama/llama-3.3-70b-instruct", name: "OpenRouter · Llama 3.3 70B" },
  { id: "openrouter/qwen/qwen-2.5-72b-instruct", name: "OpenRouter · Qwen 2.5 72B" },
  { id: "openrouter/nousresearch/hermes-3-llama-3.1-405b", name: "OpenRouter · Hermes 3 405B (uncensored)" },
  // Mistral
  { id: "mistral/mistral-large-latest", name: "Mistral Large" },
  { id: "mistral/mistral-small-latest", name: "Mistral Small" },
  { id: "mistral/codestral-latest", name: "Mistral · Codestral (code)" },
  // xAI Grok
  { id: "xai/grok-2-latest", name: "xAI · Grok 2" },
  { id: "xai/grok-beta", name: "xAI · Grok Beta" },
  // Perplexity (online + citations)
  { id: "perplexity/llama-3.1-sonar-large-128k-online", name: "Perplexity · Sonar Large Online" },
  { id: "perplexity/llama-3.1-sonar-small-128k-online", name: "Perplexity · Sonar Small Online" },
  // DeepSeek direct
  { id: "deepseek/deepseek-chat", name: "DeepSeek · Chat V3" },
  { id: "deepseek/deepseek-reasoner", name: "DeepSeek · R1 Reasoner" },
  // Together AI
  { id: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo", name: "Together · Llama 3.3 70B Turbo" },
  { id: "together/Qwen/Qwen2.5-Coder-32B-Instruct", name: "Together · Qwen2.5 Coder 32B" },
  // Fireworks
  { id: "fireworks/accounts/fireworks/models/llama-v3p3-70b-instruct", name: "Fireworks · Llama 3.3 70B" },
  { id: "fireworks/accounts/fireworks/models/deepseek-r1", name: "Fireworks · DeepSeek R1" },
  // Cerebras (fastest inference)
  { id: "cerebras/llama-3.3-70b", name: "Cerebras · Llama 3.3 70B — Fastest" },
  { id: "cerebras/llama3.1-8b", name: "Cerebras · Llama 3.1 8B" },
  // SambaNova
  { id: "sambanova/Meta-Llama-3.3-70B-Instruct", name: "SambaNova · Llama 3.3 70B" },
  // OpenAI direct (own key)
  { id: "openaidirect/gpt-4o", name: "OpenAI direct · GPT-4o" },
  { id: "openaidirect/gpt-4o-mini", name: "OpenAI direct · GPT-4o mini" },
  // NVIDIA NIM (OpenAI-compatible)
  { id: "nvidia/meta/llama-3.3-70b-instruct", name: "NVIDIA NIM · Llama 3.3 70B" },
  { id: "nvidia/meta/llama-3.1-405b-instruct", name: "NVIDIA NIM · Llama 3.1 405B" },
  { id: "nvidia/nvidia/llama-3.1-nemotron-70b-instruct", name: "NVIDIA NIM · Nemotron 70B" },
  { id: "nvidia/deepseek-ai/deepseek-r1", name: "NVIDIA NIM · DeepSeek R1" },
  { id: "nvidia/qwen/qwen2.5-coder-32b-instruct", name: "NVIDIA NIM · Qwen 2.5 Coder 32B" },
  { id: "nvidia/mistralai/mixtral-8x22b-instruct-v0.1", name: "NVIDIA NIM · Mixtral 8x22B" },
  // Cohere (OpenAI-compatible endpoint)
  { id: "cohere/command-a-03-2025", name: "Cohere · Command A (latest)" },
] as const;

export const MODES = [
  { id: "fast", name: "⚡ Fast", desc: "Quick, concise answers" },
  { id: "smart", name: "🧠 Smart", desc: "Deeper reasoning" },
  { id: "coding", name: "💻 Coding", desc: "Production-ready code" },
  { id: "creative", name: "🎨 Creative", desc: "Vivid writing" },
  { id: "search", name: "🌐 Search", desc: "Live web + citations" },
] as const;

export const ACCENTS: Record<string, { primary: string; glow: string; name: string }> = {
  violet: { name: "Violet", primary: "0.72 0.20 295", glow: "0.78 0.18 220" },
  cyan:   { name: "Cyan",   primary: "0.78 0.18 220", glow: "0.72 0.20 295" },
  green:  { name: "Green",  primary: "0.78 0.18 155", glow: "0.82 0.15 195" },
  pink:   { name: "Pink",   primary: "0.74 0.22 350", glow: "0.78 0.18 320" },
  amber:  { name: "Amber",  primary: "0.80 0.18 70",  glow: "0.74 0.20 30"  },

  // 🌈 नए 45 कलर्स (कुल 50)
  red:     { name: "Red",     primary: "0.70 0.22 25",  glow: "0.75 0.20 10" },
  orange:  { name: "Orange",  primary: "0.78 0.20 45",  glow: "0.82 0.18 35" },
  gold:    { name: "Gold",    primary: "0.82 0.18 85",  glow: "0.78 0.20 75" },
  lime:    { name: "Lime",    primary: "0.80 0.16 120", glow: "0.84 0.14 110" },
  emerald: { name: "Emerald", primary: "0.76 0.18 145", glow: "0.80 0.16 135" },
  teal:    { name: "Teal",    primary: "0.74 0.16 175", glow: "0.78 0.14 165" },
  sky:     { name: "Sky",     primary: "0.76 0.15 200", glow: "0.80 0.13 190" },
  azure:   { name: "Azure",   primary: "0.72 0.18 215", glow: "0.76 0.16 205" },
  indigo:  { name: "Indigo",  primary: "0.68 0.22 265", glow: "0.72 0.20 255" },
  purple:  { name: "Purple",  primary: "0.70 0.24 285", glow: "0.74 0.22 275" },
  magenta: { name: "Magenta", primary: "0.72 0.26 315", glow: "0.76 0.24 305" },
  rose:    { name: "Rose",    primary: "0.74 0.24 345", glow: "0.78 0.22 335" },
  coral:   { name: "Coral",   primary: "0.76 0.22 20",  glow: "0.80 0.20 10" },
  peach:   { name: "Peach",   primary: "0.80 0.18 40",  glow: "0.84 0.16 30" },
  mustard: { name: "Mustard", primary: "0.82 0.16 70",  glow: "0.78 0.18 60" },
  chartreuse: { name: "Chartreuse", primary: "0.80 0.14 100", glow: "0.84 0.12 90" },
  mint:    { name: "Mint",    primary: "0.78 0.14 130", glow: "0.82 0.12 120" },
  jade:    { name: "Jade",    primary: "0.74 0.16 160", glow: "0.78 0.14 150" },
  ocean:   { name: "Ocean",   primary: "0.70 0.14 185", glow: "0.74 0.12 175" },
  cobalt:  { name: "Cobalt",  primary: "0.66 0.20 245", glow: "0.70 0.18 235" },
  lavender:{ name: "Lavender",primary: "0.72 0.22 280", glow: "0.76 0.20 270" },
  fuchsia: { name: "Fuchsia", primary: "0.70 0.28 325", glow: "0.74 0.26 315" },
  crimson: { name: "Crimson", primary: "0.68 0.26 355", glow: "0.72 0.24 345" },
  rust:    { name: "Rust",    primary: "0.72 0.20 15",  glow: "0.76 0.18 5"  },
  butterscotch: { name: "Butterscotch", primary: "0.82 0.18 55", glow: "0.86 0.16 45" },
  olive:   { name: "Olive",   primary: "0.76 0.12 105", glow: "0.80 0.10 95" },
  seafoam: { name: "Seafoam", primary: "0.76 0.14 140", glow: "0.80 0.12 130" },
  turquoise: { name: "Turquoise", primary: "0.74 0.16 170", glow: "0.78 0.14 160" },
  ice:     { name: "Ice",     primary: "0.78 0.12 195", glow: "0.82 0.10 185" },
  sapphire:{ name: "Sapphire",primary: "0.68 0.22 230", glow: "0.72 0.20 220" },
  periwinkle: { name: "Periwinkle", primary: "0.70 0.20 260", glow: "0.74 0.18 250" },
  plum:    { name: "Plum",    primary: "0.68 0.24 300", glow: "0.72 0.22 290" },
  cherry:  { name: "Cherry",  primary: "0.70 0.26 340", glow: "0.74 0.24 330" },
  salmon:  { name: "Salmon",  primary: "0.76 0.22 10",  glow: "0.80 0.20 0"  },
  tangerine:{ name: "Tangerine",primary: "0.80 0.20 35", glow: "0.84 0.18 25" },
  honey:   { name: "Honey",   primary: "0.84 0.16 65",  glow: "0.82 0.18 55" },
  spring:  { name: "Spring",  primary: "0.80 0.14 115", glow: "0.84 0.12 105" },
  forest:  { name: "Forest",  primary: "0.72 0.16 135", glow: "0.76 0.14 125" },
  lagoon:  { name: "Lagoon",  primary: "0.70 0.15 165", glow: "0.74 0.13 155" },
  steel:   { name: "Steel",   primary: "0.68 0.14 205", glow: "0.72 0.12 195" },
  twilight:{ name: "Twilight",primary: "0.66 0.20 255", glow: "0.70 0.18 245" },
  grape:   { name: "Grape",   primary: "0.68 0.26 290", glow: "0.72 0.24 280" },
  watermelon:{ name: "Watermelon", primary: "0.72 0.28 335", glow: "0.76 0.26 325" },
  clay:    { name: "Clay",    primary: "0.74 0.18 25",  glow: "0.78 0.16 15" },
  bronze:  { name: "Bronze",  primary: "0.78 0.16 50",  glow: "0.82 0.14 40" },
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  model: string;
  setModel: (v: string) => void;
  mode: string;
  setMode: (v: string) => void;
  autoSpeak: boolean;
  setAutoSpeak: (v: boolean) => void;
  temperature: number;
  setTemperature: (v: number) => void;
  customSystem: string;
  setCustomSystem: (v: string) => void;
  accent: string;
  setAccent: (v: string) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  showTimestamps: boolean;
  setShowTimestamps: (v: boolean) => void;
  noBs: boolean;
  setNoBs: (v: boolean) => void;
  soundOnDone: boolean;
  setSoundOnDone: (v: boolean) => void;
  voiceLang: string;
  setVoiceLang: (v: string) => void;
  onExportAll: () => void;
  onImportAll: () => void;
  onClearAll: () => void;
}

export function SettingsPanel({
  open, onOpenChange,
  model, setModel, mode, setMode,
  autoSpeak, setAutoSpeak,
  temperature, setTemperature,
  customSystem, setCustomSystem,
  accent, setAccent,
  fontSize, setFontSize,
  showTimestamps, setShowTimestamps,
  noBs, setNoBs,
  soundOnDone, setSoundOnDone,
  voiceLang, setVoiceLang,
  onExportAll, onImportAll, onClearAll,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Tune dksai to match how you work.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="model" className="mt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="appearance">Look</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="model" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODES.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div>
                        <div>{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.desc}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Temperature</Label>
                <span className="text-xs text-muted-foreground">{temperature.toFixed(2)}</span>
              </div>
              <Slider value={[temperature]} min={0} max={1.5} step={0.05}
                onValueChange={(v) => setTemperature(v[0])} />
              <p className="text-xs text-muted-foreground">Lower = focused & factual. Higher = creative & wild.</p>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4 pt-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-sm">No-bakwas filter</Label>
                <p className="text-xs text-muted-foreground">Strips "as an AI", disclaimers and filler.</p>
              </div>
              <Switch checked={noBs} onCheckedChange={setNoBs} />
            </div>
            <div className="space-y-2">
              <Label>Custom system instructions</Label>
              <Textarea
                value={customSystem}
                onChange={(e) => setCustomSystem(e.target.value)}
                placeholder="E.g. Always reply in Hinglish. I'm a JS dev. Be brutally honest."
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-sm">Auto-speak replies</Label>
                <p className="text-xs text-muted-foreground">Text-to-speech each AI reply.</p>
              </div>
              <Switch checked={autoSpeak} onCheckedChange={setAutoSpeak} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-sm">Sound on done</Label>
                <p className="text-xs text-muted-foreground">Soft beep when reply finishes.</p>
              </div>
              <Switch checked={soundOnDone} onCheckedChange={setSoundOnDone} />
            </div>
            <div className="space-y-2">
              <Label>Voice input language</Label>
              <Select value={voiceLang} onValueChange={setVoiceLang}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="en-IN">English (India)</SelectItem>
                  <SelectItem value="hi-IN">Hindi</SelectItem>
                  <SelectItem value="es-ES">Spanish</SelectItem>
                  <SelectItem value="fr-FR">French</SelectItem>
                  <SelectItem value="de-DE">German</SelectItem>
                  <SelectItem value="ja-JP">Japanese</SelectItem>
                  <SelectItem value="zh-CN">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Accent color</Label>
              <div className="flex gap-2">
                {Object.entries(ACCENTS).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setAccent(k)}
                    className={`h-9 w-9 rounded-full ring-offset-2 ring-offset-background transition ${accent === k ? "ring-2 ring-foreground" : ""}`}
                    style={{ background: `oklch(${v.primary})` }}
                    title={v.name}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Font size</Label>
                <span className="text-xs text-muted-foreground">{fontSize}px</span>
              </div>
              <Slider value={[fontSize]} min={12} max={20} step={1}
                onValueChange={(v) => setFontSize(v[0])} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-sm">Show timestamps</Label>
                <p className="text-xs text-muted-foreground">Display time on each message.</p>
              </div>
              <Switch checked={showTimestamps} onCheckedChange={setShowTimestamps} />
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={onExportAll}>Export all</Button>
              <Button variant="secondary" onClick={onImportAll}>Import</Button>
            </div>
            <Button variant="destructive" onClick={onClearAll} className="w-full">Clear all chats</Button>
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground space-y-1">
              <p><strong className="text-foreground">All API keys are backend-only secrets</strong> — never visible in browser, code, or network. Add them in Lovable Cloud → Secrets (or as Cloudflare Worker secrets when self-deploying):</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><code className="rounded bg-muted px-1">LOVABLE_API_KEY</code> — default gateway (GPT-5, Gemini 3)</li>
                <li><code className="rounded bg-muted px-1">GROQ_API_KEY</code> — Groq (Llama, Mixtral, DeepSeek R1)</li>
                <li><code className="rounded bg-muted px-1">GOOGLE_API_KEY</code> — Gemini direct</li>
                <li><code className="rounded bg-muted px-1">OPENROUTER_API_KEY</code> — Claude, Llama, Qwen, 200+ models</li>
                <li><code className="rounded bg-muted px-1">MISTRAL_API_KEY</code> · <code className="rounded bg-muted px-1">XAI_API_KEY</code> · <code className="rounded bg-muted px-1">PERPLEXITY_API_KEY</code></li>
                <li><code className="rounded bg-muted px-1">DEEPSEEK_API_KEY</code> · <code className="rounded bg-muted px-1">TOGETHER_API_KEY</code> · <code className="rounded bg-muted px-1">FIREWORKS_API_KEY</code></li>
                <li><code className="rounded bg-muted px-1">CEREBRAS_API_KEY</code> · <code className="rounded bg-muted px-1">SAMBANOVA_API_KEY</code> · <code className="rounded bg-muted px-1">OPENAI_API_KEY</code></li>
                <li><code className="rounded bg-muted px-1">NVIDIA_API_KEY</code> — NVIDIA NIM (Llama, Nemotron, DeepSeek R1)</li>
                <li><code className="rounded bg-muted px-1">COHERE_API_KEY</code> — Cohere Command R+/A</li>
                <li className="pt-1"><strong className="text-foreground">Optional advanced search:</strong> <code className="rounded bg-muted px-1">TAVILY_API_KEY</code> (deepest), <code className="rounded bg-muted px-1">BRAVE_SEARCH_API_KEY</code> — auto-used in Search mode when present; falls back to free DuckDuckGo otherwise.</li>
              </ul>
              <p className="pt-1">Conversations are stored locally in your browser only.</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
