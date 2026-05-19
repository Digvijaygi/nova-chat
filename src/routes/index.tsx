import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, Sparkles, Zap, Brain, Code2, Palette, Download, Bookmark, Globe, Command, BookOpen, Drama, Focus, Eye, EyeOff, Layers, Bot, Mic, MicOff, Volume2, VolumeX, Copy, Check, Share2, ArrowUp, ArrowDown, Trash2, Edit2, RefreshCw, MoreVertical, Settings, MoonStar, Sun, Cloud, Shield, Cpu, Rocket, Gem, Crown, Flame, Wind, Droplets, Activity, Database, Network, Lock, Users, Target, Compass, Map, Clock, Calendar, Star, Heart, ThumbsUp, ThumbsDown, MessageSquare, Plus, X, Search, Filter, SortAsc, SortDesc, Grid, List, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Monitor, Smartphone, Tablet, ZapOff, Zap as ZapIcon, Sparkle } from "lucide-react";
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
import { EnsembleDialog } from "@/components/chat/EnsembleDialog";
import { AgentDialog } from "@/components/chat/AgentDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/")({
  component: ChatPage,
  head: () => ({
    meta: [
      { title: "dksai — Next Gen AI Chat" },
      { name: "description", content: "dksai — futuristic AI chat with live web search, citations, voice, coding, image gen, multi-model, and advanced features." },
      { name: "keywords", content: "dksai, AI chat, futuristic AI, GPT-5, Gemini, Claude, image generation, code AI, voice AI, multi-model" },
      { property: "og:title", content: "dksai — Next Gen AI Chat Platform" },
      { property: "og:description", content: "The most advanced AI chat with ensemble mode, agent workflows, and real-time collaboration." },
      { property: "og:url", content: "/" },
      { name: "twitter:title", content: "dksai — Next Gen AI Chat" },
      { name: "twitter:description", content: "Experience the future of AI conversation." },
    ],
    links: [
      { rel: "canonical", href: "/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
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
          description: "Next generation AI chatbot with advanced features.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
});

const MODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  fast: Zap, smart: Brain, coding: Code2, creative: Palette, search: Globe,
};

const NEW_MODES = [
  { id: "fast", name: "⚡ Turbo", icon: Zap, desc: "Blazing fast responses" },
  { id: "smart", name: "🧠 Genius", icon: Brain, desc: "Deep reasoning" },
  { id: "coding", name: "💻 Code Master", icon: Code2, desc: "Expert programmer" },
  { id: "creative", name: "🎨 Artist", icon: Palette, desc: "Unleash creativity" },
  { id: "search", name: "🌐 Explorer", icon: Globe, desc: "Live web search" },
  { id: "scientific", name: "🔬 Scientist", icon: Activity, desc: "Research mode" },
  { id: "philosophical", name: "📜 Philosopher", icon: Compass, desc: "Deep thinking" },
  { id: "humor", name: "😄 Witty", icon: Flame, desc: "Humor & wit" },
];

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

  // Existing state
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
  const [ensembleOpen, setEnsembleOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [seedPrompt, setSeedPrompt] = useState<{ text: string; n: number } | null>(null);
  const { focus, toggle: toggleFocus } = useFocusMode();

  // New futuristic features state
  const [darkMode, setDarkMode] = useLS<boolean>("dksai.darkMode", true);
  const [glowEffect, setGlowEffect] = useLS<boolean>("dksai.glowEffect", true);
  const [particlesEnabled, setParticlesEnabled] = useLS<boolean>("dksai.particles", true);
  const [typewriterEffect, setTypewriterEffect] = useLS<boolean>("dksai.typewriter", true);
  const [vibrationEnabled, setVibrationEnabled] = useLS<boolean>("dksai.vibration", false);
  const [autoSummarize, setAutoSummarize] = useLS<boolean>("dksai.autoSummarize", false);
  const [smartContext, setSmartContext] = useLS<boolean>("dksai.smartContext", true);
  const [responseSpeed, setResponseSpeed] = useLS<number>("dksai.responseSpeed", 1.0);
  const [maxTokens, setMaxTokens] = useLS<number>("dksai.maxTokens", 4096);
  const [showWordCount, setShowWordCount] = useLS<boolean>("dksai.showWordCount", true);
  const [showTypingIndicator, setShowTypingIndicator] = useLS<boolean>("dksai.typingIndicator", true);
  const [compactView, setCompactView] = useLS<boolean>("dksai.compactView", false);
  const [animationsEnabled, setAnimationsEnabled] = useLS<boolean>("dksai.animations", true);
  const [voiceInputEnabled, setVoiceInputEnabled] = useLS<boolean>("dksai.voiceInput", true);
  const [ttsEnabled, setTtsEnabled] = useLS<boolean>("dksai.tts", true);
  const [ttsVoice, setTtsVoice] = useLS<string>("dksai.ttsVoice", "google-US-English");
  const [quickReplies, setQuickReplies] = useLS<boolean>("dksai.quickReplies", true);
  const [messageEffects, setMessageEffects] = useLS<boolean>("dksai.messageEffects", true);
  const [copyConfirmation, setCopyConfirmation] = useLS<boolean>("dksai.copyConfirmation", true);
  const [shareToClipboard, setShareToClipboard] = useLS<boolean>("dksai.shareClipboard", false);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareContent, setShareContent] = useState("");
  const [sidebarExpanded, setSidebarExpanded] = useLS<boolean>("dksai.sidebarExpanded", true);
  const [layout, setLayout] = useLS<"modern" | "compact">("dksai.layout", "modern");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [tokenUsage, setTokenUsage] = useState<number | null>(null);
  const [contextLength, setContextLength] = useState<number>(0);
  const [vibrationPattern, setVibrationPattern] = useState<number[]>([50, 30, 50]);

  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];

  const [busy, setBusy] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Apply theme and effects
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const a = ACCENTS[accent] ?? ACCENTS.violet;
    const root = document.documentElement;
    root.style.setProperty("--primary", `oklch(${a.primary})`);
    root.style.setProperty("--accent", `oklch(${a.glow})`);
    root.style.setProperty("--ring", `oklch(${a.primary})`);
    root.style.setProperty("--gradient-brand", `linear-gradient(135deg, oklch(${a.primary}), oklch(${a.glow}))`);
    root.style.setProperty("--gradient-glow", glowEffect ? `radial-gradient(circle at 30% 20%, oklch(${a.primary} / 0.35), transparent 60%)` : "none");
    root.style.setProperty("--shadow-glow", glowEffect ? `0 0 40px -10px oklch(${a.primary} / 0.6)` : "none");
  }, [accent, glowEffect]);

  useEffect(() => {
    document.documentElement.style.setProperty("font-size", `${fontSize}px`);
    return () => { document.documentElement.style.removeProperty("font-size"); };
  }, [fontSize]);

  useEffect(() => {
    if (compactView) {
      document.documentElement.classList.add("compact-view");
    } else {
      document.documentElement.classList.remove("compact-view");
    }
  }, [compactView]);

  useEffect(() => {
    if (animationsEnabled) {
      document.documentElement.classList.remove("no-animations");
    } else {
      document.documentElement.classList.add("no-animations");
    }
  }, [animationsEnabled]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: animationsEnabled ? "smooth" : "auto" });
  }, [active?.messages.length, streamingId, animationsEnabled]);

  // Simulate typing effect
  useEffect(() => {
    if (streamingId && typewriterEffect) {
      const streamingMsg = active?.messages.find(m => m.id === streamingId);
      if (streamingMsg) {
        setIsTyping(true);
        const timeout = setTimeout(() => setIsTyping(false), 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [streamingId, active?.messages, typewriterEffect]);

  const speak = (text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = responseSpeed;
    u.lang = voiceLang;
    window.speechSynthesis.speak(u);
  };

  const vibrate = (pattern: number | number[]) => {
    if (vibrationEnabled && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

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
    const startTime = Date.now();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      let acc = "";
      const combinedSystem = [persona.system, customSystem.trim()].filter(Boolean).join("\n\n");
      let tokenCount = 0;
      await streamChat({
        messages: history,
        model,
        mode,
        temperature,
        maxTokens,
        customSystem: combinedSystem || undefined,
        signal: ctrl.signal,
        onDelta: (chunk) => {
          acc += chunk;
          tokenCount += chunk.split(/\s+/).length;
          updateConversation(convId, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, content: acc } : m,
            ),
          }));
        },
      });
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      setTokenUsage(tokenCount);
      
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
      if (soundOnDone) { beep(); vibrate(vibrationPattern); }
      if (autoSummarize && active?.messages.length > 10) {
        setTimeout(() => summarizeConversation(convId), 1000);
      }
      setLastMessageId(assistantMsgId);
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

  const summarizeConversation = async (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv || conv.messages.length === 0) return;
    const summaryPrompt = "Summarize this conversation in 3-5 bullet points focusing on key decisions and insights:";
    const summaryMsg: Message = { id: uid(), role: "assistant", content: "Generating summary...", createdAt: Date.now() };
    updateConversation(convId, (c) => ({ ...c, messages: [...c.messages, summaryMsg] }));
    try {
      const r = await fetch("/api/public/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conv.messages }),
      });
      const j = await r.json();
      if (j.summary) {
        updateConversation(convId, (c) => ({
          ...c,
          messages: c.messages.map(m => m.id === summaryMsg.id ? { ...m, content: `📋 **Summary**\n\n${j.summary}` } : m),
        }));
      }
    } catch { /* ignore */ }
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
          m.id === msgId ? { ...m, imageUrl: j.url, content: `🎨 Generated: *${prompt}*` } : m,
        ),
      }));
      vibrate(100);
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

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    if (copyConfirmation) toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
    vibrate(50);
  };

  const handleShare = (content: string) => {
    setShareContent(content);
    setShareDialogOpen(true);
  };

  const handleShareConfirm = async () => {
    if (shareToClipboard) {
      await navigator.clipboard.writeText(shareContent);
      toast.success("Shared to clipboard!");
    } else {
      if (navigator.share) {
        await navigator.share({ title: "dksai Message", text: shareContent });
      } else {
        await navigator.clipboard.writeText(shareContent);
        toast.success("Copied to clipboard");
      }
    }
    setShareDialogOpen(false);
    vibrate(50);
  };

  const handleAddEmoji = (emoji: string, messageId: string) => {
    setRecentEmojis(prev => [emoji, ...prev.filter(e => e !== emoji)].slice(0, 8));
    updateConversation(active!.id, (c) => ({
      ...c,
      messages: c.messages.map(m => m.id === messageId 
        ? { ...m, reaction: m.reaction === emoji ? undefined : emoji }
        : m),
    }));
    vibrate(30);
  };

  const handleSend = async (text: string) => {
    const lower = text.toLowerCase().trim();
    if (lower === "/clear") { if (active) updateConversation(active.id, (c) => ({ ...c, messages: [] })); return; }
    if (lower === "/summarize") { if (active) summarizeConversation(active.id); return; }
    if (lower.startsWith("/code")) { setMode("coding"); const rest = text.slice(5).trim(); if (rest) return handleSend(rest); return; }
    if (lower.startsWith("/smart")) { setMode("smart"); const rest = text.slice(6).trim(); if (rest) return handleSend(rest); return; }
    if (lower.startsWith("/fast")) { setMode("fast"); const rest = text.slice(5).trim(); if (rest) return handleSend(rest); return; }
    if (lower.startsWith("/creative")) { setMode("creative"); const rest = text.slice(9).trim(); if (rest) return handleSend(rest); return; }
    if (lower.startsWith("/search")) { setMode("search"); const rest = text.slice(7).trim(); if (rest) return handleSend(rest); return; }
    if (lower.startsWith("/scientific")) { setMode("scientific"); const rest = text.slice(10).trim(); if (rest) return handleSend(rest); return; }
    if (lower.startsWith("/philosophical")) { setMode("philosophical"); const rest = text.slice(13).trim(); if (rest) return handleSend(rest); return; }
    if (lower.startsWith("/humor")) { setMode("humor"); const rest = text.slice(6).trim(); if (rest) return handleSend(rest); return; }
    if (lower.startsWith("/reset")) { window.location.reload(); return; }

    let conv = active;
    if (!conv) conv = newConversation();
    const convId = conv.id;

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

    const smartHistory = smartContext 
      ? conv.messages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
      : conv.messages.map((m) => ({ role: m.role, content: m.content }));
    
    const history = [
      ...smartHistory,
      { role: "user" as const, content: text },
    ];
    setContextLength(history.length);
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

  const handleReact = (id: string, r: "up" | "down" | string) => {
    if (!active) return;
    updateConversation(active.id, (c) => ({
      ...c,
      messages: c.messages.map((m) => m.id === id ? { ...m, reaction: m.reaction === r ? undefined : r } : m),
    }));
    vibrate(30);
  };

  const handleBookmark = (id: string) => {
    if (!active) return;
    updateConversation(active.id, (c) => ({
      ...c,
      messages: c.messages.map((m) => m.id === id ? { ...m, bookmarked: !m.bookmarked } : m),
    }));
    toast.success(active.messages.find(m => m.id === id)?.bookmarked ? "Removed bookmark" : "Bookmarked");
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

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(true); }
      if (meta && e.key.toLowerCase() === "j") { e.preventDefault(); newConversation(); }
      if (meta && e.key.toLowerCase() === "p") { e.preventDefault(); setLibraryOpen(true); }
      if (meta && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); setPersonaOpen(true); }
      if (meta && e.key === ".") { e.preventDefault(); toggleFocus(); }
      if (meta && e.key.toLowerCase() === "l") { e.preventDefault(); inputRef.current?.focus(); }
      if (meta && e.key === "/") { e.preventDefault(); setSettingsOpen(true); }
      if (meta && e.key.toLowerCase() === "e") { e.preventDefault(); setEnsembleOpen(true); }
      if (meta && e.key.toLowerCase() === "b") { e.preventDefault(); setAgentOpen(true); }
      if (meta && e.shiftKey && e.key.toLowerCase() === "d") { e.preventDefault(); setDarkMode(!darkMode); }
      if (meta && e.key.toLowerCase() === "s") { e.preventDefault(); speak(active?.messages.slice(-1)[0]?.content || ""); }
      if (meta && e.key === "\\") { e.preventDefault(); setSidebarExpanded(!sidebarExpanded); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [newConversation, toggleFocus, darkMode, sidebarExpanded, active]);

  const ModeIcon = MODE_ICONS[mode] ?? Zap;

  const visibleMessages = active
    ? showBookmarks ? active.messages.filter((m) => m.bookmarked) : active.messages
    : [];

  const wordCount = active?.messages.reduce((n, m) => n + m.content.split(/\s+/).filter(Boolean).length, 0) ?? 0;
  const charCount = active?.messages.reduce((n, m) => n + m.content.length, 0) ?? 0;

  const commandActions: CommandAction[] = [
    { id: "new", label: "New chat", icon: Sparkles, shortcut: "⌘J", group: "Actions", run: () => newConversation() },
    { id: "library", label: "Open Prompt Library", icon: BookOpen, shortcut: "⌘P", group: "Actions", run: () => setLibraryOpen(true) },
    { id: "persona", label: "Switch Persona", icon: Drama, shortcut: "⌘⇧P", group: "Actions", run: () => setPersonaOpen(true) },
    { id: "ensemble", label: "Multi-Model Ensemble", icon: Layers, shortcut: "⌘E", group: "Actions", run: () => setEnsembleOpen(true) },
    { id: "agent", label: "Agent Workflow", icon: Bot, shortcut: "⌘B", group: "Actions", run: () => setAgentOpen(true) },
    { id: "settings", label: "Open Settings", icon: Settings, shortcut: "⌘/", group: "Actions", run: () => setSettingsOpen(true) },
    { id: "focus", label: focus ? "Exit Focus Mode" : "Enter Focus Mode", icon: Focus, shortcut: "⌘.", group: "Actions", run: toggleFocus },
    { id: "export", label: "Export current chat", icon: Download, group: "Actions", run: () => exportCurrent() },
    { id: "clear-current", label: "Clear current chat", icon: Trash2, group: "Actions", run: () => active && updateConversation(active.id, (c) => ({ ...c, messages: [] })) },
    { id: "summarize", label: "Summarize conversation", icon: MessageSquare, group: "Actions", run: () => active && summarizeConversation(active.id) },
    { id: "dark-mode", label: darkMode ? "Switch to Light Mode" : "Switch to Dark Mode", icon: darkMode ? Sun : MoonStar, group: "Actions", run: () => setDarkMode(!darkMode) },
    ...NEW_MODES.map((m) => ({ id: `mode-${m.id}`, label: `Mode: ${m.name}`, hint: m.desc, group: "Modes" as const, run: () => setMode(m.id), icon: m.icon })),
    ...PERSONAS.map((p) => ({ id: `persona-${p.id}`, label: `${p.emoji} ${p.name}`, hint: p.desc, group: "Personas" as const, run: () => { setPersonaId(p.id); toast.success(`Persona: ${p.name}`); }, icon: Drama })),
  ];

  return (
    <TooltipProvider>
      <div className={`relative flex h-dvh w-full overflow-hidden ${darkMode ? "dark" : ""}`}>
        {particlesEnabled && <AuroraBackground />}
        
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 pointer-events-none">
          {isTyping && showTypingIndicator && (
            <div className="bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs flex items-center gap-1 border border-primary/20">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="ml-1">dksai is thinking...</span>
            </div>
          )}
        </div>

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
          expanded={sidebarExpanded}
          onToggleExpand={() => setSidebarExpanded(!sidebarExpanded)}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setSidebarExpanded(!sidebarExpanded)}>
              {sidebarExpanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </Button>

            <div className="flex items-center gap-2">
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="h-9 w-[140px] rounded-xl border-border bg-secondary/60">
                  <ModeIcon className="mr-1 h-3.5 w-3.5 text-primary" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NEW_MODES.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setDarkMode(!darkMode)}>
                    {darkMode ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{darkMode ? "Light mode" : "Dark mode"} (⌘⇧D)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setPaletteOpen(true)}>
                    <Command className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Command Palette (⌘K)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setLibraryOpen(true)}>
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Prompt Library (⌘P)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setPersonaOpen(true)}>
                    <span className="text-base leading-none">{persona.emoji}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Persona: {persona.name} (⌘⇧P)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setEnsembleOpen(true)}>
                    <Layers className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Multi-Model Ensemble (⌘E)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setAgentOpen(true)}>
                    <Bot className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Agent Workflow (⌘B)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={toggleFocus}>
                    {focus ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Focus mode (⌘.)</TooltipContent>
              </Tooltip>

              {active && active.messages.length > 0 && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={showBookmarks ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setShowBookmarks((v) => !v)}
                        className="h-8 px-2"
                      >
                        <Bookmark className={showBookmarks ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Show bookmarked only</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={exportCurrent} className="h-8 px-2">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export chat</TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
            {!active || active.messages.length === 0 ? (
              <Welcome onPick={handleSend} onVoiceToggle={() => voiceInputEnabled} />
            ) : (
              <div className={`mx-auto w-full ${compactView ? "max-w-4xl" : "max-w-3xl"} ${layout === "compact" ? "space-y-1" : "space-y-4"}`}>
                {visibleMessages.length === 0 && showBookmarks && (
                  <div className="px-4 py-12 text-center text-sm text-muted-foreground">No bookmarked messages yet.</div>
                )}
                {visibleMessages.map((m, idx) => (
                  <div key={m.id} className={`message-container ${messageEffects ? "message-effect" : ""}`}>
                    <ChatMessage
                      message={m}
                      isStreaming={streamingId === m.id}
                      showTimestamp={showTimestamps}
                      onDelete={() => handleDeleteMessage(m.id)}
                      onEdit={m.role === "user" ? () => handleEditUserMessage(m.id) : undefined}
                      onRegenerate={m.role === "assistant" && !busy ? () => handleRegenerate(m.id) : undefined}
                      onReact={(r) => handleReact(m.id, r)}
                      onBookmark={() => handleBookmark(m.id)}
                      onSpeak={ttsEnabled ? () => speak(m.content) : undefined}
                      onCopy={() => handleCopy(m.content, m.id)}
                      onShare={() => handleShare(m.content)}
                      onAddEmoji={(emoji) => handleAddEmoji(emoji, m.id)}
                      copied={copiedId === m.id}
                    />
                    {quickReplies && idx === visibleMessages.length - 1 && m.role === "assistant" && m.content && !busy && (
                      <div className="flex gap-2 mt-2 px-4">
                        {["👍", "👎", "💡", "❓", "🎯"].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleAddEmoji(emoji, m.id)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {responseTime && tokenUsage && (
                  <div className="text-center text-xs text-muted-foreground py-2">
                    ⚡ {responseTime}ms • {tokenUsage} tokens • 📊 {contextLength} context
                  </div>
                )}
                <div className="h-4" />
              </div>
            )}
          </div>

          {active && active.messages.length > 0 && showWordCount && (
            <StatsHUD
              messages={active.messages.length}
              words={wordCount}
              chars={charCount}
              personaName={persona.name}
              modeName={NEW_MODES.find((m) => m.id === mode)?.name ?? mode}
              modelName={model}
            />
          )}

          <ChatInput 
            ref={inputRef}
            onSend={handleSend} 
            onStop={handleStop} 
            busy={busy} 
            voiceLang={voiceLang} 
            seed={seedPrompt}
            voiceEnabled={voiceInputEnabled}
          />
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
          // New settings
          darkMode={darkMode} setDarkMode={setDarkMode}
          glowEffect={glowEffect} setGlowEffect={setGlowEffect}
          particlesEnabled={particlesEnabled} setParticlesEnabled={setParticlesEnabled}
          typewriterEffect={typewriterEffect} setTypewriterEffect={setTypewriterEffect}
          vibrationEnabled={vibrationEnabled} setVibrationEnabled={setVibrationEnabled}
          autoSummarize={autoSummarize} setAutoSummarize={setAutoSummarize}
          smartContext={smartContext} setSmartContext={setSmartContext}
          responseSpeed={responseSpeed} setResponseSpeed={setResponseSpeed}
          maxTokens={maxTokens} setMaxTokens={setMaxTokens}
          showWordCount={showWordCount} setShowWordCount={setShowWordCount}
          showTypingIndicator={showTypingIndicator} setShowTypingIndicator={setShowTypingIndicator}
          compactView={compactView} setCompactView={setCompactView}
          animationsEnabled={animationsEnabled} setAnimationsEnabled={setAnimationsEnabled}
          voiceInputEnabled={voiceInputEnabled} setVoiceInputEnabled={setVoiceInputEnabled}
          ttsEnabled={ttsEnabled} setTtsEnabled={setTtsEnabled}
          quickReplies={quickReplies} setQuickReplies={setQuickReplies}
          messageEffects={messageEffects} setMessageEffects={setMessageEffects}
          copyConfirmation={copyConfirmation} setCopyConfirmation={setCopyConfirmation}
        />

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} actions={commandActions} />
        <PromptLibraryDialog open={libraryOpen} onOpenChange={setLibraryOpen} onPick={(p) => { setSeedPrompt({ text: p.prompt, n: Date.now() }); toast.success(`Loaded: ${p.title}`); }} />
        <PersonaDialog open={personaOpen} onOpenChange={setPersonaOpen} activeId={personaId} onPick={(p) => { setPersonaId(p.id); toast.success(`Persona → ${p.emoji} ${p.name}`); }} />
        <EnsembleDialog open={ensembleOpen} onOpenChange={setEnsembleOpen} seedPrompt={active?.messages.filter(m => m.role === "user").slice(-1)[0]?.content} onUseAnswer={(t) => setSeedPrompt({ text: t, n: Date.now() })} />
        <AgentDialog open={agentOpen} onOpenChange={setAgentOpen} defaultModel={model} onUseAnswer={(t) => handleSend(t)} />

        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Message</DialogTitle>
            </DialogHeader>
            <Textarea value={shareContent} onChange={(e) => setShareContent(e.target.value)} rows={6} className="font-mono text-sm" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleShareConfirm}>Share</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

const SUGGESTIONS = [
  { icon: Code2, title: "Write code", prompt: "Write a TypeScript debounce function with full JSDoc and tests." },
  { icon: Brain, title: "Explain a concept", prompt: "Explain how diffusion models generate images, like I'm a developer." },
  { icon: Palette, title: "Create an image", prompt: "/image a neon cyberpunk cat hacker on a rooftop at night, cinematic" },
  { icon: Globe, title: "Research", prompt: "Search the web for latest advancements in quantum computing 2024" },
  { icon: Activity, title: "Scientific analysis", prompt: "Explain the CRISPR gene editing mechanism and its applications" },
  { icon: Compass, title: "Philosophical", prompt: "What is the nature of consciousness in the age of AI?" },
];

function Welcome({ onPick, onVoiceToggle }: { onPick: (t: string) => void; onVoiceToggle: () => void }) {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow animate-pulse">
        <Sparkles className="h-7 w-7 text-primary-foreground" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        dksai — Next Gen AI
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ask anything. Try <code className="rounded bg-muted px-1">/image</code>, <code className="rounded bg-muted px-1">/code</code>, <code className="rounded bg-muted px-1">/scientific</code>, or voice input.
      </p>
      <div className="mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            onClick={() => onPick(s.prompt)}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card/50 p-3 text-left transition-all hover:border-primary/40 hover:bg-card hover:scale-[1.02]"
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
      <div className="mt-8 flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Command className="h-3 w-3" />K</span>
        <span>Command palette</span>
        <span className="w-px h-3 bg-border" />
        <span className="flex items-center gap-1"><Command className="h-3 w-3" />J</span>
        <span>New chat</span>
        <span className="w-px h-3 bg-border" />
        <span className="flex items-center gap-1"><Command className="h-3 w-3" />.</span>
        <span>Focus mode</span>
      </div>
    </div>
  );
}
