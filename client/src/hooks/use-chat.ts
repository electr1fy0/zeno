const getChat = async (chatId: string): Promise<Chat> => {
  const resp = await fetch(`${API_BASE_URL}/chat/${encodeURIComponent(chatId)}`)

  if (!resp.ok) throw new Error("failed to fetch chat")

  return resp.json()
}

async function createChat(): Promise<string> {
  const resp = await fetch(`${API_BASE_URL}/chat`, {
    method: "get",
  })
  if (!resp.ok) throw new Error("failed to create a chat")
  return resp.text()
}

async function getAiResponse(chatId: string, msg: string): Promise<string> {
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
