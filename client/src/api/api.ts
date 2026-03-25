import type { Chat } from "@/types"
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "")

export type HistoryItem = {
  _id: string
  title?: string
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

export const createNewChat = async (message: string): Promise<Chat> => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  })
  console.log(message)
  if (!response.ok) {
    throw new Error(
      `Failed to create chat: ${response.status} ${response.statusText}`
    )
  }

  return response.json()
}

export const sendMessage = async (
  chatId: string,
  message: string
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

  return response.text()
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
