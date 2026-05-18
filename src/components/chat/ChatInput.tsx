import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, MicOff, Square, Paperclip, Sparkles, Image as ImageIcon, Code2, Brain, Palette, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  onSend: (text: string) => void;
  onStop?: () => void;
  busy?: boolean;
  initialValue?: string;
  seed?: { text: string; n: number } | null;
  voiceLang?: string;
}

// Web Speech API typings (avoid `any`)
type SR = {
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
};

const SLASH_COMMANDS = [
  { cmd: "/image", desc: "Generate an image", icon: ImageIcon },
  { cmd: "/code", desc: "Switch to coding mode", icon: Code2 },
  { cmd: "/smart", desc: "Switch to smart mode", icon: Brain },
  { cmd: "/creative", desc: "Switch to creative mode", icon: Palette },
  { cmd: "/fast", desc: "Switch to fast mode", icon: Zap },
  { cmd: "/clear", desc: "Clear current chat", icon: Sparkles },
  { cmd: "/summary", desc: "Summarize this chat", icon: Sparkles },
];

export function ChatInput({ onSend, onStop, busy, initialValue = "", seed, voiceLang = "en-US" }: Props) {
  const [value, setValue] = useState(initialValue);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SR | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setValue(initialValue), [initialValue]);

  useEffect(() => {
    if (seed && seed.text) {
      setValue(seed.text);
      setTimeout(() => taRef.current?.focus(), 30);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed?.n]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 240) + "px";
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || busy) return;
    onSend(text);
    setValue("");
  };

  const toggleVoice = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SR;
      webkitSpeechRecognition?: new () => SR;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = voiceLang;
    rec.onresult = (e) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setValue(txt);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const handleFile = async (f: File) => {
    if (f.size > 200_000) { toast.error("File too large (max 200KB)"); return; }
    const ok = /\.(txt|md|json|csv|log|js|ts|tsx|jsx|py|html|css|sql|yml|yaml)$/i.test(f.name)
      || f.type.startsWith("text/");
    if (!ok) { toast.error("Only text files are supported"); return; }
    const text = await f.text();
    const wrapped = `\n\n--- Attached file: ${f.name} ---\n${text}\n--- end of file ---\n`;
    setValue((v) => (v ? v + wrapped : `Please analyze:\n${wrapped}`));
    toast.success(`${f.name} attached`);
  };

  const showSlash = value.startsWith("/") && !value.includes(" ");
  const charCount = value.length;

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-4 pt-2">
      {showSlash && (
        <div className="mb-2 overflow-hidden rounded-xl border border-border bg-card/90 shadow-glow backdrop-blur">
          {SLASH_COMMANDS.filter((s) => s.cmd.startsWith(value.toLowerCase())).map((s) => (
            <button
              key={s.cmd}
              onClick={() => { setValue(s.cmd + " "); taRef.current?.focus(); }}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-secondary/60"
            >
              <s.icon className="h-4 w-4 text-primary" />
              <span className="font-mono text-primary">{s.cmd}</span>
              <span className="text-xs text-muted-foreground">{s.desc}</span>
            </button>
          ))}
        </div>
      )}
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border border-border bg-card/80 p-2 shadow-glow backdrop-blur",
          listening && "ring-2 ring-primary/60",
        )}
      >
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".txt,.md,.json,.csv,.log,.js,.ts,.tsx,.jsx,.py,.html,.css,.sql,.yml,.yaml,text/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl"
          onClick={() => fileRef.current?.click()}
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl"
          onClick={toggleVoice}
          title={listening ? "Stop voice" : "Voice input"}
        >
          {listening ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
        </Button>
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          onPaste={async (e) => {
            const f = e.clipboardData.files?.[0];
            if (f && f.type.startsWith("text/")) { e.preventDefault(); await handleFile(f); }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) await handleFile(f);
          }}
          rows={1}
          placeholder="Message dksai…  Try /image, /code, or attach a file"
          className="flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {busy ? (
          <Button
            type="button"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl bg-destructive hover:bg-destructive/90"
            onClick={onStop}
            title="Stop"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl bg-brand-gradient text-primary-foreground hover:opacity-90 disabled:opacity-40"
            onClick={submit}
            disabled={!value.trim()}
            title="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Ctrl+K new chat · Ctrl+L focus · Shift+Enter newline</span>
        <span>{charCount > 0 ? `${charCount} chars` : "dksai Developed by Digvijay(DKSNEXT)"}</span>
      </div>
    </div>
  );
}
