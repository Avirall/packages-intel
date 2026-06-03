"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Bot, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import type { Message } from "@/types/chat"

const PRESETS = [
  "Which package is riskiest?",
  "Find packages with bus factor 1",
  "Any packages with no commits in 12 months?",
]

export function ChatPanel({ scanId }: { scanId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get(`/chat/${scanId}`)
      .then((r) => setMessages(r.data.messages ?? []))
      .finally(() => setLoading(false))
  }, [scanId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || sending) return
    setSending(true)
    setInput("")

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const { data } = await api.post(`/chat/${scanId}`, { content: text })
      setMessages((prev) => [...prev, data])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: "err", role: "assistant", content: "Sorry, something went wrong.", created_at: new Date().toISOString() },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="flex flex-col h-[640px]">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          Ask about your dependencies
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-3/4" />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="space-y-2 pt-2">
            <p className="text-muted-foreground text-xs mb-3">Try asking:</p>
            {PRESETS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="block w-full text-left text-sm border border-border rounded-lg px-3 py-2 hover:bg-secondary/50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex gap-2.5 text-sm", m.role === "user" && "flex-row-reverse")}
            >
              <div className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                m.role === "user" ? "bg-primary/20" : "bg-secondary"
              )}>
                {m.role === "user"
                  ? <User className="h-3.5 w-3.5 text-primary" />
                  : <Bot className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <div className={cn(
                "rounded-xl px-3 py-2 max-w-[85%] leading-relaxed",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground"
              )}>
                {m.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </CardContent>

      <div className="p-3 border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask about your dependencies…"
          disabled={sending}
          className="text-sm"
        />
        <Button size="icon" onClick={() => send(input)} disabled={sending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
