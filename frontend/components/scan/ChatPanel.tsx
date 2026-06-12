"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Bot, User, Sparkles } from "lucide-react"
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
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, created_at: new Date().toISOString() }
    setMessages((prev) => [...prev, userMsg])
    try {
      const { data } = await api.post(`/chat/${scanId}`, { content: text })
      setMessages((prev) => [...prev, data])
    } catch {
      setMessages((prev) => [...prev, { id: "err", role: "assistant", content: "Sorry, something went wrong.", created_at: new Date().toISOString() }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[640px] rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-teal-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">AI Risk Analyst</p>
          <p className="text-xs text-gray-500">Powered by Neo4j Aura Agent</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-teal-600 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
          live
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {loading ? (
          <div className="space-y-3 pt-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-3/4" />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-gray-400 mb-3 px-1">Suggested questions</p>
            {PRESETS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="block w-full text-left text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800 transition-all duration-150 text-gray-600 shadow-xs"
              >
                {q}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn("flex gap-2.5 text-sm", m.role === "user" && "flex-row-reverse")}>
              <div className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center shrink-0 border",
                m.role === "user"
                  ? "bg-teal-50 border-teal-200"
                  : "bg-white border-gray-200"
              )}>
                {m.role === "user"
                  ? <User className="h-3.5 w-3.5 text-teal-600" />
                  : <Bot className="h-3.5 w-3.5 text-gray-500" />}
              </div>
              <div className={cn(
                "rounded-2xl px-4 py-2.5 max-w-[85%] leading-relaxed shadow-xs",
                m.role === "user"
                  ? "bg-gradient-to-b from-teal-500 to-teal-600 text-white rounded-tr-sm"
                  : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
              )}>
                {m.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask about your dependencies…"
          disabled={sending}
          className="text-sm"
        />
        <Button
          size="icon"
          onClick={() => send(input)}
          disabled={sending || !input.trim()}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
