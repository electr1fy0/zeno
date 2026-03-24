import type { Chat } from "@/types"
import { apiRequest } from "./client"

export type HistoryItem = {
  _id: string
  title?: string
}

export const getChatById = async (id: string): Promise<Chat> => {
  return apiRequest<Chat>(`/chat/${encodeURIComponent(id)}`)
}

export const createNewChat = async (message: string): Promise<Chat> => {
  return apiRequest<Chat>("/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}

export const sendMessage = async (
  chatId: string,
  message: string
): Promise<string> => {
  return apiRequest<string>(`/chat/${encodeURIComponent(chatId)}`, {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}

export const getChatHistory = async (): Promise<HistoryItem[]> => {
  return apiRequest<HistoryItem[]>("/history")
}
