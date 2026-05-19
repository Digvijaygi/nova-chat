import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers, Sparkles, Trophy, Loader2, Check, AlertTriangle, Copy } from "lucide-react";
import { MODELS } from "./SettingsPanel";
import { toast } from "sonner";

interface ProvInfo { id: string; label: string; envKey: string; available: boolean }

interface EnsembleResult {
  model: string;
  provider: string;
  ms: number;
  content: string;
  error: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  seedPrompt?: string;
  onUseAnswer?: (text: string) => void;
}

const DEFAULT_PICK = [
  "google/gemini-3-flash-preview",
  "openai/gpt-5-mini",
  "google/gemini-2.5-pro",
];

export function EnsembleDialog({ open, onOpenChange, seedPrompt, onUseAnswer }: Props) {
  const [prompt, setPrompt] = useState(seedPrompt ?? "");
  const [selected, setSelected] = useState<string[]>(DEFAULT_PICK);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<EnsembleResult[]>([]);
  const [merged, setMerged] = useState("");
  const [judgeError, setJudgeError] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProvInfo[]>([]);

  useEffect(() => { if (open && seedPrompt) setPrompt(seedPrompt); }, [open, seedPrompt]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/public/providers").then((r) => r.json()).then((j) => setProviders(j.providers ?? [])).catch(() => {});
  }, [open]);

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const isModelAvailable = (modelId: string) => {
    const prefix = modelId.includes("/") ? modelId.split("/")[0] : "lovable";
    const knownPrefixes = providers.map((p) => p.id);
    const provId = knownPrefixes.includes(prefix) ? prefix : "lovable";
    return providers.find((p) => p.id === provId)?.available ?? false;
  };

  const run = async () => {
    if (!prompt.trim() || selected.length === 0) { toast.error("Pick a prompt and at least one model"); return; }
    setBusy(true); setResults([]); setMerged(""); setJudgeError(null);
    try {
      const r = await fetch("/api/public/ensemble", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, models: selected }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Ensemble failed");
      setResults(j.results ?? []);
      setMerged(j.merged ?? "");
      setJudgeError(j.judgeError ?? null);
      toast.success(`Ensemble complete · ${(j.results ?? []).filter((x: EnsembleResult) => !x.error).length}/${(j.results ?? []).length} models responded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const copy = (txt: string) => { navigator.clipboard.writeText(txt); toast.success("Copied"); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Multi-Model Ensemble
          </DialogTitle>
          <DialogDescription>
            Send one prompt to many models in parallel. A judge model merges them into one best answer.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Prompt</div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask anything — all selected models answer in parallel…"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">Models ({selected.length} picked)</div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(DEFAULT_PICK)}>Reset</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(MODELS.filter((m) => isModelAvailable(m.id)).slice(0, 6).map((m) => m.id))}>Auto-pick available</Button>
                </div>
              </div>
              <div className="grid max-h-44 gap-1 overflow-y-auto rounded-lg border border-border bg-secondary/30 p-2 sm:grid-cols-2">
                {MODELS.map((m) => {
                  const checked = selected.includes(m.id);
                  const avail = isModelAvailable(m.id);
                  return (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition ${checked ? "bg-primary/15 text-foreground" : "hover:bg-secondary"} ${!avail ? "opacity-60" : ""}`}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggle(m.id)} className="accent-primary" />
                      <span className="flex-1 truncate">{m.name}</span>
                      {!avail && <span className="rounded bg-amber-500/15 px-1 text-[9px] text-amber-500">no key</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            <Button onClick={run} disabled={busy} className="w-full bg-brand-gradient text-primary-foreground shadow-glow hover:opacity-90">
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running {selected.length} models…</> : <><Sparkles className="mr-2 h-4 w-4" /> Run ensemble</>}
            </Button>

            {merged && (
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Trophy className="h-4 w-4 text-primary" /> Merged best answer
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => copy(merged)}><Copy className="h-3 w-3" /></Button>
                    {onUseAnswer && <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { onUseAnswer(merged); onOpenChange(false); }}>Use →</Button>}
                  </div>
                </div>
                <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-sm">{merged}</div>
                {judgeError && <div className="mt-2 text-[10px] text-amber-500">Judge fallback: {judgeError}</div>}
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Individual model answers</div>
                {results.map((r, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card/40 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate text-xs">
                        {r.error ? <AlertTriangle className="h-3 w-3 text-destructive" /> : <Check className="h-3 w-3 text-emerald-500" />}
                        <span className="truncate font-medium">{r.model}</span>
                        <Badge variant="secondary" className="text-[9px]">{r.provider || "-"}</Badge>
                        {!r.error && <span className="text-[9px] text-muted-foreground">{r.ms}ms</span>}
                      </div>
                      {!r.error && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => copy(r.content)}><Copy className="h-3 w-3" /></Button>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap text-xs text-foreground/85">
                      {r.error ? <span className="text-destructive">{r.error}</span> : r.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}