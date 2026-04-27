"use client"

import * as React from "react"
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldAlert,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  INITIAL_BOT_MESSAGE,
  INITIAL_STATE,
  type ChatMessage,
  type ChatbotState,
  type DiagnosisSummary,
} from "@/lib/chatbot"

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function makeBotMessage(
  content: string,
  extra?: Partial<ChatMessage>,
): ChatMessage {
  return {
    id: makeId(),
    role: "bot",
    content,
    timestamp: Date.now(),
    ...extra,
  }
}

const FIRST_MESSAGE: ChatMessage = makeBotMessage(INITIAL_BOT_MESSAGE.content, {
  quickReplies: INITIAL_BOT_MESSAGE.quickReplies,
})

export function Chatbot() {
  const [open, setOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>([FIRST_MESSAGE])
  const [state, setState] = React.useState<ChatbotState>(INITIAL_STATE)
  const [input, setInput] = React.useState("")
  const [typing, setTyping] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Auto-scroll on new messages or when opened.
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    })
  }, [messages, typing, open])

  // Focus input when chat opens.
  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  async function send(rawText: string) {
    const text = rawText.trim()
    if (!text) {
      setError("Please type a message before sending.")
      return
    }
    setError(null)

    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    }

    // Strip quick replies from the previous bot message so users can't reuse them.
    setMessages((prev) => {
      const cleared = prev.map((m, i) =>
        i === prev.length - 1 && m.role === "bot"
          ? { ...m, quickReplies: undefined }
          : m,
      )
      return [...cleared, userMsg]
    })
    setInput("")
    setTyping(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, state }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as {
        state: ChatbotState
        replies: Array<Omit<ChatMessage, "id" | "timestamp" | "role">>
      }

      // Surface bot replies sequentially with small delays for a natural feel.
      for (const reply of data.replies) {
        await new Promise((r) => setTimeout(r, 350))
        setMessages((prev) => [
          ...prev,
          makeBotMessage(reply.content, {
            quickReplies: reply.quickReplies,
            diagnosis: reply.diagnosis,
          }),
        ])
      }
      setState(data.state)
    } catch (err) {
      console.log("[medibot] error:", (err as Error).message)
      setMessages((prev) => [
        ...prev,
        makeBotMessage(
          "Sorry, I had trouble responding. Please try again in a moment.",
        ),
      ])
    } finally {
      setTyping(false)
    }
  }

  function handleQuickReply(value: string) {
    if (value.toLowerCase() === "start over") {
      restart()
      return
    }
    void send(value)
  }

  function restart() {
    setState(INITIAL_STATE)
    setMessages([
      makeBotMessage(INITIAL_BOT_MESSAGE.content, {
        quickReplies: INITIAL_BOT_MESSAGE.quickReplies,
      }),
    ])
    setError(null)
  }

  return (
    <>
      {/* Launcher */}
      <Button
        onClick={() => setOpen((v) => !v)}
        size="icon"
        aria-label={open ? "Close MediBot" : "Open MediBot"}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-50 size-14 rounded-full shadow-lg"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </Button>

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-5 z-50 flex w-[calc(100vw-2.5rem)] max-w-sm origin-bottom-right flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl transition-all duration-200",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0",
        )}
        style={{ height: "min(36rem, 80vh)" }}
        role="dialog"
        aria-label="MediBot chat"
        aria-hidden={!open}
      >
        <ChatHeader onRestart={restart} />

        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top_right,theme(colors.primary/0.06),transparent_50%)] px-4 py-4"
        >
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              onQuickReply={handleQuickReply}
              disabled={typing}
            />
          ))}
          {typing && <TypingIndicator />}
        </div>

        {error && (
          <div className="flex items-center gap-2 border-t border-border bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void send(input)
          }}
          className="flex items-center gap-2 border-t border-border bg-background p-3"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              if (error) setError(null)
            }}
            placeholder="Type a message…"
            aria-label="Message MediBot"
            disabled={typing}
            className="rounded-full"
          />
          <Button
            type="submit"
            size="icon"
            disabled={typing || !input.trim()}
            className="rounded-full"
            aria-label="Send"
          >
            <Send className="size-4" />
          </Button>
        </form>

        <p className="border-t border-border bg-muted/40 px-3 py-1.5 text-center text-[10px] leading-tight text-muted-foreground">
          MediBot provides general information only. Not a medical diagnosis.
        </p>
      </div>
    </>
  )
}

// --------------------------------------------------------------------
// Subcomponents
// --------------------------------------------------------------------

function ChatHeader({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
      <div className="relative flex size-9 items-center justify-center rounded-full bg-primary-foreground/15">
        <Bot className="size-5" />
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-green-400 ring-2 ring-primary" />
      </div>
      <div className="flex-1 leading-tight">
        <p className="text-sm font-semibold">MediBot</p>
        <p className="text-[11px] opacity-90">Virtual health assistant</p>
      </div>
      <button
        type="button"
        onClick={onRestart}
        className="rounded-full p-1.5 text-primary-foreground/80 transition hover:bg-primary-foreground/15 hover:text-primary-foreground"
        aria-label="Start a new conversation"
        title="Start over"
      >
        <RotateCcw className="size-4" />
      </button>
    </div>
  )
}

function MessageBubble({
  message,
  onQuickReply,
  disabled,
}: {
  message: ChatMessage
  onQuickReply: (value: string) => void
  disabled: boolean
}) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="size-3.5" />
        </div>
      )}
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-200",
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-secondary text-secondary-foreground",
          )}
        >
          {message.content}
          {message.diagnosis && <DiagnosisCard diagnosis={message.diagnosis} />}
        </div>

        <span
          suppressHydrationWarning
          className="px-2 text-[10px] text-muted-foreground"
        >
          {formatTime(message.timestamp)}
        </span>

        {message.quickReplies && message.quickReplies.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {message.quickReplies.map((qr) => (
              <button
                key={qr}
                type="button"
                disabled={disabled}
                onClick={() => onQuickReply(qr)}
                className="rounded-full border border-primary/30 bg-background px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
              >
                {qr}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DiagnosisCard({ diagnosis }: { diagnosis: DiagnosisSummary }) {
  const tone =
    diagnosis.riskLevel === "High"
      ? "border-destructive/40 bg-destructive/5 text-destructive"
      : diagnosis.riskLevel === "Medium"
        ? "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400"
        : "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"

  const barTone = (risk: DiagnosisSummary["riskLevel"]) =>
    risk === "High"
      ? "bg-destructive"
      : risk === "Medium"
        ? "bg-amber-500"
        : "bg-emerald-500"

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-border bg-background p-3 text-foreground shadow-sm">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Differential diagnosis (top {diagnosis.possibleConditions.length})
        </p>
        <ul className="mt-2 space-y-2">
          {diagnosis.possibleConditions.map((c, i) => (
            <li key={c.id} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="flex items-baseline gap-1.5 text-xs font-medium text-foreground">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  {c.name}
                </span>
                <span className="font-mono text-xs font-semibold text-foreground">
                  {c.probability}%
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={c.probability}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${c.name} probability`}
              >
                <div
                  className={cn("h-full rounded-full transition-all", barTone(c.riskLevel))}
                  style={{ width: `${c.probability}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium",
          tone,
        )}
      >
        <ShieldAlert className="size-3.5" />
        Risk Level: {diagnosis.riskLevel}
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Reasoning
        </p>
        <p className="mt-1 text-xs leading-relaxed text-foreground">
          {diagnosis.explanation}
        </p>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Recommendations
        </p>
        <ul className="mt-1 space-y-1">
          {diagnosis.recommendations.map((s) => (
            <li
              key={s}
              className="flex items-start gap-2 text-xs text-foreground"
            >
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="rounded-md bg-muted px-2 py-1.5 text-[10px] leading-snug text-muted-foreground">
        {diagnosis.disclaimer}
      </p>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex w-full gap-2">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bot className="size-3.5" />
      </div>
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 shadow-sm">
          <span
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <span className="px-2 text-[10px] text-muted-foreground">
          MediBot is typing…
        </span>
      </div>
    </div>
  )
}
