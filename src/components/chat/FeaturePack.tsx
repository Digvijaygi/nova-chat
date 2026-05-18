import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PROMPT_LIBRARY, PROMPT_CATEGORIES, type PromptItem } from "@/lib/prompts-library";
import { PERSONAS, type Persona } from "@/lib/personas";
import {
  Sparkles, Command, BookOpen, Drama, MessageSquarePlus, Settings as SettingsIcon,
  Download, Trash2, Bookmark, Focus, Search, Zap, Brain, Code2, Palette, Globe, Image as ImageIcon, Mic,
} from "lucide-react";

// ============ COMMAND PALETTE ============
export interface CommandAction {
  id: string;
  label: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  run: () => void;
  group: "Actions" | "Personas" | "Prompts" | "Modes" | "Navigate";
}

interface PaletteProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  actions: CommandAction[];
}

export function CommandPalette({ open, onOpenChange, actions }: PaletteProps) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => { if (open) { setQ(""); setIdx(0); } }, [open]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return actions;
    return actions.filter((a) =>
      a.label.toLowerCase().includes(t) || a.hint?.toLowerCase().includes(t) || a.group.toLowerCase().includes(t),
    );
  }, [actions, q]);

  useEffect(() => { if (idx >= filtered.length) setIdx(0); }, [filtered.length, idx]);

  const grouped = useMemo(() => {
    const g: Record<string, CommandAction[]> = {};
    filtered.forEach((a) => { (g[a.group] ??= []).push(a); });
    return g;
  }, [filtered]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const a = filtered[idx];
      if (a) { a.run(); onOpenChange(false); }
    }
  };

  let runningIdx = -1;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Command className="h-4 w-4 text-primary" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            onKeyDown={onKey}
            placeholder="Search actions, personas, prompts, modes…"
            className="h-9 border-0 bg-transparent focus-visible:ring-0"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        <ScrollArea className="max-h-[60vh]">
          <div className="p-1.5">
            {filtered.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">No matches</div>
            )}
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-1">
                <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</div>
                {items.map((a) => {
                  runningIdx++;
                  const active = runningIdx === idx;
                  const Icon = a.icon ?? Sparkles;
                  return (
                    <button
                      key={a.id}
                      onClick={() => { a.run(); onOpenChange(false); }}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition ${active ? "bg-secondary text-foreground" : "text-foreground/85 hover:bg-secondary/60"}`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <span className="flex-1 truncate">{a.label}</span>
                      {a.hint && <span className="hidden text-xs text-muted-foreground sm:inline">{a.hint}</span>}
                      {a.shortcut && <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">{a.shortcut}</kbd>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============ PROMPT LIBRARY ============
interface LibProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (p: PromptItem) => void;
}

export function PromptLibraryDialog({ open, onOpenChange, onPick }: LibProps) {
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return PROMPT_LIBRARY.filter((p) =>
      (cat === "All" || p.category === cat) &&
      (!t || p.title.toLowerCase().includes(t) || p.prompt.toLowerCase().includes(t)),
    );
  }, [cat, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Prompt Library</DialogTitle>
          <DialogDescription>{PROMPT_LIBRARY.length}+ ready-to-use prompts. Click any to load into your input.</DialogDescription>
        </DialogHeader>
        <div className="border-b border-border px-4 py-2">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search prompts…" className="h-9 pl-8" />
          </div>
          <div className="flex flex-wrap gap-1">
            {["All", ...PROMPT_CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-2.5 py-0.5 text-xs transition ${cat === c ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:bg-secondary"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <ScrollArea className="max-h-[55vh]">
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {filtered.map((p, i) => (
              <button
                key={i}
                onClick={() => { onPick(p); onOpenChange(false); }}
                className="group rounded-xl border border-border bg-card/50 p-3 text-left transition hover:border-primary/40 hover:bg-card"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">{p.title}</span>
                  <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{p.prompt}</p>
              </button>
            ))}
            {filtered.length === 0 && <div className="col-span-2 py-10 text-center text-sm text-muted-foreground">No prompts match.</div>}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============ PERSONA PICKER ============
interface PersonaProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activeId: string;
  onPick: (p: Persona) => void;
}

export function PersonaDialog({ open, onOpenChange, activeId, onPick }: PersonaProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2"><Drama className="h-4 w-4 text-primary" /> AI Personas</DialogTitle>
          <DialogDescription>Switch personality. Replaces your system prompt instantly.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => { onPick(p); onOpenChange(false); }}
                className={`group flex items-start gap-3 rounded-xl border p-3 text-left transition ${activeId === p.id ? "border-primary bg-primary/5" : "border-border bg-card/50 hover:border-primary/40 hover:bg-card"}`}
              >
                <div className="text-2xl">{p.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    {activeId === p.id && <Badge className="h-4 text-[9px]">ACTIVE</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============ AURORA BACKGROUND ============
export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 left-1/3 h-96 w-96 animate-aurora-1 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 h-[28rem] w-[28rem] animate-aurora-2 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute -bottom-32 left-1/4 h-96 w-96 animate-aurora-3 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(var(--primary)/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(var(--primary)/0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
    </div>
  );
}

// ============ STATS HUD ============
interface StatsProps {
  messages: number;
  words: number;
  chars: number;
  personaName?: string;
  modeName: string;
  modelName: string;
}

export function StatsHUD({ messages, words, chars, personaName, modeName, modelName }: StatsProps) {
  const tokens = Math.ceil(words * 1.33);
  const readMin = Math.max(1, Math.round(words / 220));
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-border/40 px-3 py-1 text-[10px] text-muted-foreground">
      <span title="Messages"><span className="text-primary">{messages}</span> msgs</span>
      <span>·</span>
      <span title="Words"><span className="text-primary">{words}</span> words</span>
      <span>·</span>
      <span title="Chars"><span className="text-primary">{chars}</span> chars</span>
      <span>·</span>
      <span title="Estimated tokens">~<span className="text-primary">{tokens}</span> tokens</span>
      <span>·</span>
      <span title="Reading time">{readMin} min read</span>
      <span>·</span>
      <span className="text-foreground/70">{modeName} · {modelName.split("/").slice(-1)[0]}</span>
      {personaName && personaName !== "Default" && (
        <>
          <span>·</span>
          <span className="text-primary">🎭 {personaName}</span>
        </>
      )}
    </div>
  );
}

// ============ FOCUS MODE HOOK ============
export function useFocusMode() {
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("focus-mode", focus);
    return () => { document.documentElement.classList.remove("focus-mode"); };
  }, [focus]);
  return { focus, setFocus, toggle: () => setFocus((v) => !v) };
}

// Re-export icons used in palette builder
export const PaletteIcons = {
  Sparkles, Command, BookOpen, Drama, MessageSquarePlus, SettingsIcon,
  Download, Trash2, Bookmark, Focus, Zap, Brain, Code2, Palette, Globe, ImageIcon, Mic,
};
