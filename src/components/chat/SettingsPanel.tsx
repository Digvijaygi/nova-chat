import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  model: string;
  setModel: (v: string) => void;
  mode: string;
  setMode: (v: string) => void;
  autoSpeak: boolean;
  setAutoSpeak: (v: boolean) => void;
}

export function SettingsPanel({
  open,
  onOpenChange,
  model,
  setModel,
  mode,
  setMode,
  autoSpeak,
  setAutoSpeak,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Tune dksai to match how you work.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
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
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="text-sm">Auto-speak replies</Label>
              <p className="text-xs text-muted-foreground">Read AI responses aloud automatically.</p>
            </div>
            <Switch checked={autoSpeak} onCheckedChange={setAutoSpeak} />
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
            Your AI key is stored securely on the backend. Conversations are saved locally in your browser.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}