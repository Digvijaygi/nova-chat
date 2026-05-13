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
] as const;

export const MODES = [
  { id: "fast", name: "⚡ Fast", desc: "Quick, concise answers" },
  { id: "smart", name: "🧠 Smart", desc: "Deeper reasoning" },
  { id: "coding", name: "💻 Coding", desc: "Production-ready code" },
  { id: "creative", name: "🎨 Creative", desc: "Vivid writing" },
] as const;

export const ACCENTS: Record<string, { primary: string; glow: string; name: string }> = {
  violet: { name: "Violet", primary: "0.72 0.20 295", glow: "0.78 0.18 220" },
  cyan:   { name: "Cyan",   primary: "0.78 0.18 220", glow: "0.72 0.20 295" },
  green:  { name: "Green",  primary: "0.78 0.18 155", glow: "0.82 0.15 195" },
  pink:   { name: "Pink",   primary: "0.74 0.22 350", glow: "0.78 0.18 320" },
  amber:  { name: "Amber",  primary: "0.80 0.18 70",  glow: "0.74 0.20 30"  },
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
              <p><strong className="text-foreground">Your AI key is stored on the backend</strong> — never visible in the browser, code, or network requests. It lives as a secret named <code className="rounded bg-muted px-1">LOVABLE_API_KEY</code> in your project's backend (Lovable Cloud → Secrets). Nobody can extract it from the frontend.</p>
              <p>Conversations are saved locally in your browser only.</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}