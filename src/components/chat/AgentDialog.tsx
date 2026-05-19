import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Play, Loader2, Check, AlertTriangle, Globe, FileText, Brain, Sparkles, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

type StepStatus = "pending" | "running" | "done" | "error";
interface UIStep { id: number; title: string; type?: string; status: StepStatus; detail?: string }
interface Source { title: string; url: string }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultModel?: string;
  onUseAnswer?: (text: string) => void;
}

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  search: Globe, fetch: FileText, think: Brain, summarize: Sparkles,
};

const SAMPLES = [
  "Latest iPhone 17 leaks aur launch date kya hai? Sources ke saath summary do.",
  "Compare best free LLM APIs (Groq, Cerebras, Together) — speed, models, limits.",
  "Research top 3 indie SaaS launched this month and what makes them unique.",
  "Find current AI news today and give me a 5-bullet brief.",
];

export function AgentDialog({ open, onOpenChange, defaultModel, onUseAnswer }: Props) {
  const [task, setTask] = useState("");
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<UIStep[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [logs.length]);

  const reset = () => { setSteps([]); setLogs([]); setResult(""); setSources([]); };

  const upsertStep = (s: { id: number; title: string; status: StepStatus; detail?: string }) =>
    setSteps((cur) => {
      const i = cur.findIndex((x) => x.id === s.id);
      if (i === -1) return [...cur, { ...s }];
      const next = [...cur]; next[i] = { ...next[i], ...s }; return next;
    });

  const run = async () => {
    if (!task.trim()) { toast.error("Describe a task first"); return; }
    reset(); setBusy(true);
    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      const r = await fetch("/api/public/agent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, model: defaultModel }), signal: ctrl.signal,
      });
      if (!r.ok || !r.body) {
        let msg = `Agent failed (${r.status})`;
        try { const j = await r.json(); if (j?.error) msg = j.error; } catch { /* */ }
        throw new Error(msg);
      }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
          if (!line) continue;
          try {
            const ev = JSON.parse(line);
            if (ev.type === "log") setLogs((l) => [...l, ev.text]);
            else if (ev.type === "plan" && Array.isArray(ev.steps)) {
              setSteps(ev.steps.map((s: any) => ({ id: s.id, title: s.title, type: s.type, status: "pending" as StepStatus })));
            }
            else if (ev.type === "step") upsertStep({ id: ev.id, title: ev.title, status: ev.status, detail: ev.detail });
            else if (ev.type === "result") { setResult(ev.content); setSources(ev.sources ?? []); }
            else if (ev.type === "done") { /* finished */ }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") toast.info("Agent stopped");
      else toast.error(e instanceof Error ? e.message : "Agent failed");
    } finally {
      setBusy(false); abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && busy) stop(); onOpenChange(v); }}>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" /> Agent Workflow
            <Badge variant="secondary" className="ml-1 text-[9px]">AUTONOMOUS</Badge>
          </DialogTitle>
          <DialogDescription>
            Describe a task. The agent plans steps, searches the web, reads pages, and gives you a final summary with sources.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[78vh]">
          <div className="space-y-3 p-4">
            <div className="space-y-2">
              <Textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="E.g. Research the best free coding LLMs in 2025 and tell me which is fastest."
                rows={3}
                disabled={busy}
              />
              <div className="flex flex-wrap gap-1">
                {SAMPLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setTask(s)}
                    disabled={busy}
                    className="rounded-full border border-border bg-secondary/40 px-2.5 py-0.5 text-[10px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                  >
                    {s.slice(0, 50)}…
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={run} disabled={busy} className="flex-1 bg-brand-gradient text-primary-foreground shadow-glow">
                  {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Working…</> : <><Play className="mr-2 h-4 w-4" /> Start agent</>}
                </Button>
                {busy && <Button variant="outline" onClick={stop}>Stop</Button>}
              </div>
            </div>

            {steps.length > 0 && (
              <div className="rounded-xl border border-border bg-card/40 p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan</div>
                <ol className="space-y-1.5">
                  {steps.map((s) => {
                    const Icon = (s.type && TYPE_ICON[s.type]) || Sparkles;
                    return (
                      <li key={s.id} className="flex items-center gap-2 text-sm">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary">
                          {s.status === "running" ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> :
                            s.status === "done" ? <Check className="h-3 w-3 text-emerald-500" /> :
                            s.status === "error" ? <AlertTriangle className="h-3 w-3 text-destructive" /> :
                            <Icon className="h-3 w-3 text-muted-foreground" />}
                        </span>
                        <span className={s.status === "done" ? "text-foreground" : s.status === "running" ? "font-medium text-foreground" : "text-foreground/70"}>
                          {s.title}
                        </span>
                        {s.detail && <span className="ml-auto text-[10px] text-muted-foreground">{s.detail}</span>}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {logs.length > 0 && (
              <div className="rounded-xl border border-border bg-black/40 p-3 font-mono">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Live logs</div>
                <div ref={logRef} className="max-h-44 overflow-y-auto text-[11px] leading-relaxed text-emerald-300/90">
                  {logs.map((l, i) => <div key={i} className="whitespace-pre-wrap">{l}</div>)}
                </div>
              </div>
            )}

            {result && (
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Result</div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied"); }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    {onUseAnswer && <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { onUseAnswer(result); onOpenChange(false); }}>Send to chat →</Button>}
                  </div>
                </div>
                <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-sm">{result}</div>
                {sources.length > 0 && (
                  <div className="mt-3 border-t border-border/50 pt-2">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sources</div>
                    <ul className="space-y-1">
                      {sources.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">[{i + 1}]</span>
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">{s.title}</a>
                          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}