import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, Sparkles, Zap, Brain, Code2, Palette, Download, Bookmark, Globe, Command, BookOpen, Drama, Focus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { SettingsPanel, MODELS, MODES, ACCENTS } from "@/components/chat/SettingsPanel";
import { useConversations, uid, type Message } from "@/lib/chat-store";
import { streamChat } from "@/lib/stream-chat";
import { stripBS } from "@/lib/no-bs";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CommandPalette, PromptLibraryDialog, PersonaDialog, AuroraBackground, StatsHUD, useFocusMode,
  type CommandAction,
} from "@/components/chat/FeaturePack";
import { PERSONAS } from "@/lib/personas";

export const Route = createFileRoute("/")({
  component: ChatPage,
  head: () => ({
    meta: [
      { title: "dksai — Modern AI Chat" },
      { name: "description", content: "dksai — fast AI chat with live web search, citations, voice, coding mode, image generation, multi-model switching and a beautiful dark UI." },
      { name: "keywords", content: "dksai, AI chat, ChatGPT alternative, free AI assistant, web search AI, GPT-5, Gemini, image generation, code AI, voice AI" },
      { property: "og:title", content: "dksai — Modern AI Chat with Live Web Search" },
      { property: "og:description", content: "Streaming AI with citations, voice, coding mode, image generation, and multi-model switching." },
      { property: "og:url", content: "/" },
      { name: "twitter:title", content: "dksai — Modern AI Chat" },
      { name: "twitter:description", content: "Streaming AI with live web search, citations, voice and image generation." },
    ],
    links: [
      { rel: "canonical", href: "/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "dksai",
          applicationCategory: "Chatbot",
          operatingSystem: "Web",
          description: "Modern AI chatbot with live web search, citations, voice input, coding mode and image generation.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
});

const MODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  fast: Zap, smart: Brain, coding: Code2, creative: Palette, search: Globe,
};

function useLS<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setV(JSON.parse(raw) as T);
    } catch { /* ignore */ }
  }, [key]);
  const set = (next: T) => {
    setV(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
  };
  return [v, set];
}

function beep() {
  try {
    const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 660; o.type = "sine";
    g.gain.value = 0.05;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 120);
  } catch { /* ignore */ }
}

function ChatPage() {
  const {
    conversations, activeId, setActiveId, active,
    newConversation, deleteConversation, updateConversation, renameConversation,
    togglePin, clearAll, importConversations,
  } = useConversations();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [model, setModel] = useLS<string>("dksai.model", MODELS[0].id);
  const [mode, setMode] = useLS<string>("dksai.mode", "fast");
  const [autoSpeak, setAutoSpeak] = useLS<boolean>("dksai.autoSpeak", false);
  const [temperature, setTemperature] = useLS<number>("dksai.temperature", 0.7);
  const [customSystem, setCustomSystem] = useLS<string>("dksai.customSystem", "");
  const [accent, setAccent] = useLS<string>("dksai.accent", "violet");
  const [fontSize, setFontSize] = useLS<number>("dksai.fontSize", 15);
  const [showTimestamps, setShowTimestamps] = useLS<boolean>("dksai.timestamps", false);
  const [noBs, setNoBs] = useLS<boolean>("dksai.noBs", true);
  const [soundOnDone, setSoundOnDone] = useLS<boolean>("dksai.sound", false);
  const [voiceLang, setVoiceLang] = useLS<string>("dksai.voiceLang", "en-US");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [personaId, setPersonaId] = useLS<string>("dksai.persona", "default");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [seedPrompt, setSeedPrompt] = useState<{ text: string; n: number } | null>(null);
  const { focus, toggle: toggleFocus } = useFocusMode();
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];

  const [busy, setBusy] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Apply accent + font size dynamically
  useEffect(() => {
    const a = ACCENTS[accent] ?? ACCENTS.violet;
    const root = document.documentElement;
    root.style.setProperty("--primary", `oklch(${a.primary})`);
    root.style.setProperty("--accent", `oklch(${a.glow})`);
    root.style.setProperty("--ring", `oklch(${a.primary})`);
    root.style.setProperty("--gradient-brand", `linear-gradient(135deg, oklch(${a.primary}), oklch(${a.glow}))`);
    root.style.setProperty("--gradient-glow", `radial-gradient(circle at 30% 20%, oklch(${a.primary} / 0.25), transparent 60%)`);
    root.style.setProperty("--shadow-glow", `0 0 40px -10px oklch(${a.primary} / 0.5)`);
  }, [accent]);

  useEffect(() => {
    document.documentElement.style.setProperty("font-size", `${fontSize}px`);
    return () => { document.documentElement.style.removeProperty("font-size"); };
  }, [fontSize]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, streamingId]);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.lang = voiceLang;
    window.speechSynthesis.speak(u);
  };

  // Auto-title for first user message
  const autoTitle = async (convId: string, firstMessage: string) => {
    try {
      const r = await fetch("/api/public/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: firstMessage }),
      });
      const j = await r.json();
      if (j?.title) renameConversation(convId, j.title);
    } catch { /* ignore */ }
  };

  const runStream = async (
    convId: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    assistantMsgId: string,
  ) => {
    setBusy(true);
    setStreamingId(assistantMsgId);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      let acc = "";
      const combinedSystem = [persona.system, customSystem.trim()].filter(Boolean).join("\n\n");
      await streamChat({
        messages: history,
        model,
        mode,
        temperature,
        customSystem: combinedSystem || undefined,
        signal: ctrl.signal,
        onDelta: (chunk) => {
          acc += chunk;
          updateConversation(convId, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, content: acc } : m,
            ),
          }));
        },
      });
      // Apply no-bs filter once stream is complete
      if (noBs && acc) {
        const filtered = stripBS(acc);
        if (filtered !== acc) {
          updateConversation(convId, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, content: filtered } : m,
            ),
          }));
          acc = filtered;
        }
      }
      if (autoSpeak && acc) speak(acc);
      if (soundOnDone) beep();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to get response";
      updateConversation(convId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantMsgId ? { ...m, content: m.content || `⚠️ ${msg}` } : m,
        ),
      }));
      toast.error(msg);
    } finally {
      setBusy(false);
      setStreamingId(null);
      abortRef.current = null;
    }
  };

  const generateImage = async (convId: string, prompt: string, msgId: string) => {
    setBusy(true); setStreamingId(msgId);
    try {
      const r = await fetch("/api/public/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Image generation failed");
      updateConversation(convId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === msgId ? { ...m, imageUrl: j.url, content: `Generated: *${prompt}*` } : m,
        ),
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Image failed";
      toast.error(msg);
      updateConversation(convId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === msgId ? { ...m, content: `⚠️ ${msg}` } : m,
        ),
      }));
    } finally {
      setBusy(false); setStreamingId(null);
    }
  };

  const handleSend = async (text: string) => {
    // Slash commands
    const lower = text.toLowerCase().trim();
    if (lower === "/clear") { if (active) updateConversation(active.id, (c) => ({ ...c, messages: [] })); return; }
    if (lower.startsWith("/code")) { setMode("coding"); const rest = text.slice(5).trim(); if (rest) return handleSend(rest); return; }
    if (lower.startsWith("/smart")) { setMode("smart"); const rest = text.slice(6).trim(); if (rest) return handleSend(rest); return; }
    if (lower.startsWith("/fast")) { setMode("fast"); const rest = text.slice(5).trim(); if (rest) return handleSend(rest); return; }
    if (lower.startsWith("/creative")) { setMode("creative"); const rest = text.slice(9).trim(); if (rest) return handleSend(rest); return; }
    if (lower.startsWith("/summary")) { return handleSend("Summarize this conversation in 5 bullet points."); }

    let conv = active;
    if (!conv) conv = newConversation();
    const convId = conv.id;

    // /image command
    if (lower.startsWith("/image")) {
      const prompt = text.slice(6).trim();
      if (!prompt) { toast.error("Usage: /image <prompt>"); return; }
      const userMsg: Message = { id: uid(), role: "user", content: text, createdAt: Date.now() };
      const assistantMsg: Message = { id: uid(), role: "assistant", content: "Generating image…", createdAt: Date.now() };
      const isFirst = conv.messages.length === 0;
      updateConversation(convId, (c) => ({
        ...c,
        title: isFirst ? prompt.slice(0, 50) : c.title,
        messages: [...c.messages, userMsg, assistantMsg],
      }));
      await generateImage(convId, prompt, assistantMsg.id);
      return;
    }

    const userMsg: Message = { id: uid(), role: "user", content: text, createdAt: Date.now() };
    const assistantMsg: Message = { id: uid(), role: "assistant", content: "", createdAt: Date.now() };

    const isFirst = conv.messages.length === 0;
    updateConversation(convId, (c) => ({
      ...c,
      title: isFirst ? text.slice(0, 50) : c.title,
      messages: [...c.messages, userMsg, assistantMsg],
    }));

    const history = [
      ...conv.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: text },
    ];
    await runStream(convId, history, assistantMsg.id);
    if (isFirst) autoTitle(convId, text);
  };

  const handleStop = () => abortRef.current?.abort();

  const handleDeleteMessage = (id: string) => {
    if (!active) return;
    updateConversation(active.id, (c) => ({ ...c, messages: c.messages.filter((m) => m.id !== id) }));
  };

  const handleEditUserMessage = (id: string) => {
    if (!active) return;
    const msg = active.messages.find((m) => m.id === id);
    if (!msg) return;
    const next = prompt("Edit your message:", msg.content);
    if (!next || next.trim() === msg.content) return;
    const idx = active.messages.findIndex((m) => m.id === id);
    const trimmed = active.messages.slice(0, idx);
    updateConversation(active.id, (c) => ({ ...c, messages: trimmed }));
    setTimeout(() => handleSend(next.trim()), 0);
  };

  const handleRegenerate = async (assistantId: string) => {
    if (!active || busy) return;
    const idx = active.messages.findIndex((m) => m.id === assistantId);
    if (idx <= 0) return;
    const upTo = active.messages.slice(0, idx);
    const cleared: Message = { ...active.messages[idx], content: "" };
    updateConversation(active.id, (c) => ({ ...c, messages: [...upTo, cleared] }));
    const history = upTo.map((m) => ({ role: m.role, content: m.content }));
    await runStream(active.id, history, assistantId);
  };

  const handleReact = (id: string, r: "up" | "down") => {
    if (!active) return;
    updateConversation(active.id, (c) => ({
      ...c,
      messages: c.messages.map((m) => m.id === id ? { ...m, reaction: m.reaction === r ? undefined : r } : m),
    }));
  };

  const handleBookmark = (id: string) => {
    if (!active) return;
    updateConversation(active.id, (c) => ({
      ...c,
      messages: c.messages.map((m) => m.id === id ? { ...m, bookmarked: !m.bookmarked } : m),
    }));
  };

  const exportCurrent = () => {
    if (!active) return;
    const md = `# ${active.title}\n\n${active.messages.map((m) =>
      `**${m.role === "user" ? "You" : "dksai"}** (${new Date(m.createdAt).toLocaleString()}):\n\n${m.content}\n`).join("\n---\n\n")}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${active.title || "chat"}.md`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported");
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(conversations, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dksai-chats.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("All chats exported");
  };

  const importAll = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "application/json";
    input.onchange = async () => {
      const f = input.files?.[0]; if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (!Array.isArray(data)) throw new Error("Invalid file");
        importConversations(data);
        toast.success(`Imported ${data.length} chats`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Import failed");
      }
    };
    input.click();
  };

  const handleClearAll = () => {
    if (confirm("Delete ALL chats? This cannot be undone.")) {
      clearAll();
      toast.success("All chats cleared");
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(true); }
      if (meta && e.key.toLowerCase() === "j") { e.preventDefault(); newConversation(); }
      if (meta && e.key.toLowerCase() === "p") { e.preventDefault(); setLibraryOpen(true); }
      if (meta && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); setPersonaOpen(true); }
      if (meta && e.key === ".") { e.preventDefault(); toggleFocus(); }
      if (meta && e.key.toLowerCase() === "l") {
        e.preventDefault();
        (document.querySelector("textarea") as HTMLTextAreaElement | null)?.focus();
      }
      if (meta && e.key === "/") { e.preventDefault(); setSettingsOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [newConversation, toggleFocus]);

  const ModeIcon = MODE_ICONS[mode] ?? Zap;

  const visibleMessages = active
    ? showBookmarks ? active.messages.filter((m) => m.bookmarked) : active.messages
    : [];

  // stats
  const wordCount = active?.messages.reduce((n, m) => n + m.content.split(/\s+/).filter(Boolean).length, 0) ?? 0;
  const charCount = active?.messages.reduce((n, m) => n + m.content.length, 0) ?? 0;

  const commandActions: CommandAction[] = [
    { id: "new", label: "New chat", icon: Sparkles, shortcut: "⌘J", group: "Actions", run: () => newConversation() },
    { id: "library", label: "Open Prompt Library", icon: BookOpen, shortcut: "⌘P", group: "Actions", run: () => setLibraryOpen(true) },
    { id: "persona", label: "Switch Persona", icon: Drama, shortcut: "⌘⇧P", group: "Actions", run: () => setPersonaOpen(true) },
    { id: "settings", label: "Open Settings", icon: Sparkles, shortcut: "⌘/", group: "Actions", run: () => setSettingsOpen(true) },
    { id: "focus", label: focus ? "Exit Focus Mode" : "Enter Focus Mode", icon: Focus, shortcut: "⌘.", group: "Actions", run: toggleFocus },
    { id: "export", label: "Export current chat", icon: Download, group: "Actions", run: () => exportCurrent() },
    { id: "clear-current", label: "Clear current chat", icon: Bookmark, group: "Actions", run: () => active && updateConversation(active.id, (c) => ({ ...c, messages: [] })) },
    ...MODES.map((m) => ({ id: `mode-${m.id}`, label: `Mode: ${m.name}`, hint: m.desc, group: "Modes" as const, run: () => setMode(m.id), icon: Zap })),
    ...PERSONAS.map((p) => ({ id: `persona-${p.id}`, label: `${p.emoji} ${p.name}`, hint: p.desc, group: "Personas" as const, run: () => { setPersonaId(p.id); toast.success(`Persona: ${p.name}`); }, icon: Drama })),
  ];

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <AuroraBackground />

      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={newConversation}
        onDelete={deleteConversation}
        onTogglePin={togglePin}
        onOpenSettings={() => setSettingsOpen(true)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2 backdrop-blur">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="h-9 w-[130px] rounded-xl border-border bg-secondary/60">
                <ModeIcon className="mr-1 h-3.5 w-3.5 text-primary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
              </SelectContent>
            </Select>

            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-9 w-[180px] rounded-xl border-border bg-secondary/60 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setPaletteOpen(true)} title="Command Palette (⌘K)">
              <Command className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setLibraryOpen(true)} title="Prompt Library (⌘P)">
              <BookOpen className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setPersonaOpen(true)} title={`Persona: ${persona.name}`}>
              <span className="text-base leading-none">{persona.emoji}</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={toggleFocus} title="Focus mode (⌘.)">
              {focus ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            {active && active.messages.length > 0 && (
              <>
                <Button
                  variant={showBookmarks ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setShowBookmarks((v) => !v)}
                  title="Show only bookmarked"
                  className="h-8 px-2"
                >
                  <Bookmark className={showBookmarks ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
                </Button>
                <Button variant="ghost" size="sm" onClick={exportCurrent} title="Export chat" className="h-8 px-2">
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => { const t = prompt("Rename chat", active.title); if (t) renameConversation(active.id, t); }}
                  className="hidden h-8 text-xs text-muted-foreground sm:inline-flex"
                >
                  Rename
                </Button>
              </>
            )}
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          {!active || active.messages.length === 0 ? (
            <Welcome onPick={handleSend} />
          ) : (
            <div className="mx-auto w-full max-w-3xl">
              {visibleMessages.length === 0 && showBookmarks && (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">No bookmarked messages yet.</div>
              )}
              {visibleMessages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  isStreaming={streamingId === m.id}
                  showTimestamp={showTimestamps}
                  onDelete={() => handleDeleteMessage(m.id)}
                  onEdit={m.role === "user" ? () => handleEditUserMessage(m.id) : undefined}
                  onRegenerate={m.role === "assistant" && !busy ? () => handleRegenerate(m.id) : undefined}
                  onReact={m.role === "assistant" ? (r) => handleReact(m.id, r) : undefined}
                  onBookmark={() => handleBookmark(m.id)}
                  onSpeak={speak}
                />
              ))}
              <div className="h-4" />
            </div>
          )}
        </div>

        {active && active.messages.length > 0 && (
          <StatsHUD
            messages={active.messages.length}
            words={wordCount}
            chars={charCount}
            personaName={persona.name}
            modeName={MODES.find((m) => m.id === mode)?.name ?? mode}
            modelName={model}
          />
        )}

        <ChatInput onSend={handleSend} onStop={handleStop} busy={busy} voiceLang={voiceLang} seed={seedPrompt} />
      </main>

      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        model={model} setModel={setModel}
        mode={mode} setMode={setMode}
        autoSpeak={autoSpeak} setAutoSpeak={setAutoSpeak}
        temperature={temperature} setTemperature={setTemperature}
        customSystem={customSystem} setCustomSystem={setCustomSystem}
        accent={accent} setAccent={setAccent}
        fontSize={fontSize} setFontSize={setFontSize}
        showTimestamps={showTimestamps} setShowTimestamps={setShowTimestamps}
        noBs={noBs} setNoBs={setNoBs}
        soundOnDone={soundOnDone} setSoundOnDone={setSoundOnDone}
        voiceLang={voiceLang} setVoiceLang={setVoiceLang}
        onExportAll={exportAll}
        onImportAll={importAll}
        onClearAll={handleClearAll}
      />

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} actions={commandActions} />
      <PromptLibraryDialog open={libraryOpen} onOpenChange={setLibraryOpen} onPick={(p) => { setSeedPrompt({ text: p.prompt, n: Date.now() }); toast.success(`Loaded: ${p.title}`); }} />
      <PersonaDialog open={personaOpen} onOpenChange={setPersonaOpen} activeId={personaId} onPick={(p) => { setPersonaId(p.id); toast.success(`Persona → ${p.emoji} ${p.name}`); }} />
    </div>
  );
}

const SUGGESTIONS = [
  { icon: Code2, title: "Write code", prompt: "Write a TypeScript debounce function with full JSDoc and tests." },
  { icon: Brain, title: "Explain a concept", prompt: "Explain how diffusion models generate images, like I'm a developer." },
  { icon: Palette, title: "Create an image", prompt: "/image a neon cyberpunk cat hacker on a rooftop at night, cinematic" },
  { icon: Zap, title: "Plan something", prompt: "Plan a 7-day learning roadmap for mastering React performance." },
];

function Welcome({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
        <Sparkles className="h-7 w-7 text-primary-foreground" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        How can <span className="text-brand-gradient">dksai</span> help today?
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ask anything. Try <code className="rounded bg-muted px-1">/image</code>, <code className="rounded bg-muted px-1">/code</code>, or attach a file. Developed by{" "}
        <a 
          href="https://dksnext.vercel.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
        >
          Digvijay(DKSNEXT)
        </a>
      </p>
      <div className="mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            onClick={() => onPick(s.prompt)}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card/50 p-3 text-left transition hover:border-primary/40 hover:bg-card"
          >
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary group-hover:bg-brand-gradient group-hover:text-primary-foreground">
              <s.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">{s.title}</div>
              <div className="truncate text-xs text-muted-foreground">{s.prompt}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
