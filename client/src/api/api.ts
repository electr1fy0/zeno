import type { Chat } from "@/types"
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "")

type StreamEvent =
  | { type: "meta"; chatId: string }
  | { type: "chunk"; text: string }
  | { type: "done"; title?: string }

type StreamHandlers = {
  onMeta?: (chatId: string) => void
  onChunk?: (chunk: string) => void
  onDone?: (event: Extract<StreamEvent, { type: "done" }>) => void
}

export type HistoryItem = {
  _id: string
  title?: string
}

async function readStream(
  response: Response,
  handlers: StreamHandlers = {}
): Promise<{ chatId?: string; text: string; title?: string }> {
  if (!response.body) {
    throw new Error("Response body is missing")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let text = ""
  let chatId: string | undefined
  let title: string | undefined

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (!line.trim()) continue

      const event = JSON.parse(line) as StreamEvent

      if (event.type === "meta") {
        chatId = event.chatId
        handlers.onMeta?.(event.chatId)
      }

      if (event.type === "chunk") {
        text += event.text
        handlers.onChunk?.(event.text)
      }

      if (event.type === "done") {
        title = event.title
        handlers.onDone?.(event)
      }
    }
  }

  if (buffer.trim()) {
    const event = JSON.parse(buffer) as StreamEvent
    if (event.type === "meta") {
      chatId = event.chatId
      handlers.onMeta?.(event.chatId)
    }
    if (event.type === "chunk") {
      text += event.text
      handlers.onChunk?.(event.text)
    }
    if (event.type === "done") {
      title = event.title
      handlers.onDone?.(event)
    }
  }

  return { chatId, text, title }
}

export const getChatById = async (id: string): Promise<Chat> => {
  const response = await fetch(`${API_BASE_URL}/chat/${encodeURIComponent(id)}`)
  if (!response.ok) {
    throw new Error(
      `Failed to load chat: ${response.status} ${response.statusText}`
    )
  }

  return response.json()
}

export const createNewChat = async (
  message: string,
  handlers?: StreamHandlers
): Promise<Chat> => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  })
  if (!response.ok) {
    throw new Error(
      `Failed to create chat: ${response.status} ${response.statusText}`
    )
  }

  const { chatId } = await readStream(response, handlers)
  if (!chatId) {
    throw new Error("Chat creation did not return a chat id")
  }

  return getChatById(chatId)
}

export const sendMessage = async (
  chatId: string,
  message: string,
  handlers?: StreamHandlers
): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL}/chat/${encodeURIComponent(chatId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    }
  )
  if (!response.ok) {
    throw new Error(
      `Failed to send message: ${response.status} ${response.statusText}`
    )
  }

  const { text } = await readStream(response, handlers)
  return text
}

export const getChatHistory = async (): Promise<HistoryItem[]> => {
  const response = await fetch(`${API_BASE_URL}/history`)
  if (!response.ok) {
    throw new Error(
      `Failed to load chat history: ${response.status} ${response.statusText}`
    )
  }
  return response.json()
}
