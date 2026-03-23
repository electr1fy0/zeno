import type { Chat } from "@/types"

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "")

export const getChatById = async (id: string): Promise<Chat> => {
  const resp = await fetch(`${API_BASE_URL}/chat/${encodeURIComponent(id)}`)

  if (!resp.ok) throw new Error("failed to fetch chat")

  return resp.json()
}

export async function createNewChat(msg: string): Promise<Chat> {
  const resp = await fetch(`${API_BASE_URL}/chat`, {
    method: "post",
    body: JSON.stringify({ message: msg }),
  })
  if (!resp.ok) throw new Error("failed to create a chat")
  return resp.json()
}

export async function getMessageReply(
  chatId: string,
  msg: string
): Promise<string> {
  const resp = await fetch(
    `${API_BASE_URL}/chat/${encodeURIComponent(chatId)}`,
    {
      method: "post",
      body: JSON.stringify({ message: msg }),
      headers: { "Content-Type": "application/json" },
    }
  )

  if (!resp.ok) throw new Error("failed to fetch ai resp")

  const data = await resp.text()
  console.log("resp", data)

  return data
}

export async function getHistory(): Promise<Chat[]> {
  const resp = await fetch(`${API_BASE_URL}/history`, {
    method: "get",
  })

  return resp.json()
}
