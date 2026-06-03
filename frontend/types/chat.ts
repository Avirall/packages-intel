export type MessageRole = "user" | "assistant"

export interface Message {
  id: string
  role: MessageRole
  content: string
  created_at: string
}

export interface ChatHistory {
  scan_id: string
  messages: Message[]
}
