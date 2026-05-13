import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (text: string) => void;
  onStop?: () => void;
  busy?: boolean;
  initialValue?: string;
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

export function ChatInput({ onSend, onStop, busy, initialValue = "" }: Props) {
  const [value, setValue] = useState(initialValue);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SR | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setValue(initialValue), [initialValue]);

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
    rec.lang = "en-US";
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

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-4 pt-2">
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border border-border bg-card/80 p-2 shadow-glow backdrop-blur",
          listening && "ring-2 ring-primary/60",
        )}
      >
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
          rows={1}
          placeholder="Message dksai…  (Shift+Enter for new line)"
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
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        dksai can make mistakes. Verify important info.
      </p>
    </div>
  );
}