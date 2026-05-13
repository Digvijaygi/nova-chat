import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Pencil, RefreshCw, Trash2, Volume2, User, Sparkles, ThumbsUp, ThumbsDown, Bookmark, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Message } from "@/lib/chat-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSpeak?: (text: string) => void;
  onReact?: (r: "up" | "down") => void;
  onBookmark?: () => void;
  showTimestamp?: boolean;
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border bg-[#1d1f27]">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
        <span className="font-mono">{language || "code"}</span>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-muted hover:text-foreground transition"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{ margin: 0, background: "transparent", fontSize: "0.85rem" }}
        PreTag="div"
      >
        {value.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}

export function ChatMessage({ message, isStreaming, onRegenerate, onEdit, onDelete, onSpeak, onReact, onBookmark, showTimestamp }: Props) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const share = async () => {
    const text = `${isUser ? "You" : "dksai"}: ${message.content}`;
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* fall through */ }
    }
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className={cn("group flex gap-3 px-4 py-5 animate-fade-in-up", isUser ? "" : "")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
          isUser ? "bg-secondary text-secondary-foreground" : "bg-brand-gradient text-primary-foreground shadow-glow",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>{isUser ? "You" : "dksai"}</span>
          {showTimestamp && (
            <span className="text-[10px] opacity-60">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {message.bookmarked && <Bookmark className="h-3 w-3 fill-primary text-primary" />}
        </div>
        {isUser ? (
          <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground">
            {message.content}
          </div>
        ) : (
          <div className="prose prose-invert max-w-none text-[15px] leading-relaxed prose-p:my-2 prose-pre:my-0 prose-pre:bg-transparent prose-pre:p-0 prose-code:before:content-none prose-code:after:content-none">
            {message.imageUrl && (
              <img src={message.imageUrl} alt="Generated" className="mb-3 max-h-96 rounded-lg border border-border" />
            )}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const value = String(children ?? "");
                  const isBlock = value.includes("\n") || match;
                  if (!isBlock) {
                    return (
                      <code
                        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return <CodeBlock language={match?.[1] ?? ""} value={value} />;
                },
              }}
            >
              {message.content || ""}
            </ReactMarkdown>
            {isStreaming && (
              <span className="ml-1 inline-flex gap-1 align-middle">
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
            )}
          </div>
        )}

        <div className="mt-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={copy}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={share} title="Share">
            <Share2 className="h-3 w-3" />
          </Button>
          {onBookmark && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onBookmark} title="Bookmark">
              <Bookmark className={cn("h-3 w-3", message.bookmarked && "fill-primary text-primary")} />
            </Button>
          )}
          {!isUser && onSpeak && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onSpeak(message.content)}>
              <Volume2 className="h-3 w-3" />
            </Button>
          )}
          {!isUser && onReact && (
            <>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onReact("up")}>
                <ThumbsUp className={cn("h-3 w-3", message.reaction === "up" && "fill-primary text-primary")} />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onReact("down")}>
                <ThumbsDown className={cn("h-3 w-3", message.reaction === "down" && "fill-destructive text-destructive")} />
              </Button>
            </>
          )}
          {!isUser && onRegenerate && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onRegenerate}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          {isUser && onEdit && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onEdit}>
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}