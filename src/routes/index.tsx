import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, Sparkles, Zap, Brain, Code2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { SettingsPanel, MODELS, MODES } from "@/components/chat/SettingsPanel";
import { useConversations, uid, type Message } from "@/lib/chat-store";
import { streamChat } from "@/lib/stream-chat";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  component: ChatPage,
  head: () => ({
    meta: [
      { title: "dksai — Modern AI Chat" },
      { name: "description", content: "dksai is a fast, beautiful AI chat with streaming, voice, code mode, and more." },
    ],
  }),
});

const MODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  fast: Zap,
  smart: Brain,
  coding: Code2,
  creative: Palette,
};

function ChatPage() {
  const {
    conversations,
    activeId,
    setActiveId,
    active,
    newConversation,
    deleteConversation,
    updateConversation,
    renameConversation,
  } = useConversations();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [mode, setMode] = useState<string>("fast");
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [busy, setBusy] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = localStorage.getItem("dksai.model");
    const md = localStorage.getItem("dksai.mode");
    const sp = localStorage.getItem("dksai.autoSpeak");
    if (m) setModel(m);
    if (md) setMode(md);
    if (sp) setAutoSpeak(sp === "1");
  }, []);
  useEffect(() => localStorage.setItem("dksai.model", model), [model]);
  useEffect(() => localStorage.setItem("dksai.mode", mode), [mode]);
  useEffect(() => localStorage.setItem("dksai.autoSpeak", autoSpeak ? "1" : "0"), [autoSpeak]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, streamingId]);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
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
      await streamChat({
        messages: history,
        model,
        mode,
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
      if (autoSpeak && acc) speak(acc);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to get response";
      updateConversation(convId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: m.content || `⚠️ ${msg}` }
            : m,
        ),
      }));
    } finally {
      setBusy(false);
      setStreamingId(null);
      abortRef.current = null;
    }
  };

  const handleSend = async (text: string) => {
    let conv = active;
    if (!conv) conv = newConversation();
    const convId = conv.id;

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
  };

  const handleStop = () => abortRef.current?.abort();

  const handleDeleteMessage = (id: string) => {
    if (!active) return;
    updateConversation(active.id, (c) => ({
      ...c,
      messages: c.messages.filter((m) => m.id !== id),
    }));
  };

  const handleEditUserMessage = (id: string) => {
    if (!active) return;
    const msg = active.messages.find((m) => m.id === id);
    if (!msg) return;
    const next = prompt("Edit your message:", msg.content);
    if (!next || next.trim() === msg.content) return;
    // Rewrite history up to (but not including) this message, then resend
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

  const ModeIcon = MODE_ICONS[mode] ?? Zap;

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background text-foreground">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ backgroundImage: "var(--gradient-glow)" }}
      />

      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={newConversation}
        onDelete={deleteConversation}
        onOpenSettings={() => setSettingsOpen(true)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="h-9 w-[140px] rounded-xl border-border bg-secondary/60">
                <ModeIcon className="mr-1 h-3.5 w-3.5 text-primary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-9 w-[200px] rounded-xl border-border bg-secondary/60 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {active && active.messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const t = prompt("Rename chat", active.title);
                  if (t) renameConversation(active.id, t);
                }}
                className="hidden text-xs text-muted-foreground sm:inline-flex"
              >
                Rename
              </Button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          {!active || active.messages.length === 0 ? (
            <Welcome onPick={handleSend} />
          ) : (
            <div className="mx-auto w-full max-w-3xl">
              {active.messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  isStreaming={streamingId === m.id}
                  onDelete={() => handleDeleteMessage(m.id)}
                  onEdit={m.role === "user" ? () => handleEditUserMessage(m.id) : undefined}
                  onRegenerate={
                    m.role === "assistant" && !busy ? () => handleRegenerate(m.id) : undefined
                  }
                  onSpeak={speak}
                />
              ))}
              <div className="h-4" />
            </div>
          )}
        </div>

        <ChatInput onSend={handleSend} onStop={handleStop} busy={busy} />
      </main>

      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        model={model}
        setModel={setModel}
        mode={mode}
        setMode={setMode}
        autoSpeak={autoSpeak}
        setAutoSpeak={setAutoSpeak}
      />
    </div>
  );
}

const SUGGESTIONS = [
  { icon: Code2, title: "Write code", prompt: "Write a TypeScript debounce function with full JSDoc and tests." },
  { icon: Brain, title: "Explain a concept", prompt: "Explain how diffusion models generate images, like I'm a developer." },
  { icon: Palette, title: "Be creative", prompt: "Write a short noir-style poem about a lonely streetlamp at 3am." },
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
        Ask anything. Switch modes for fast answers, deep reasoning, code, or creative work.
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
