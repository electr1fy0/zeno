import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { Input } from "./components/ui/input"
import { ArrowUp, BrainIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { SidebarProvider } from "./components/ui/sidebar"
import { AppSidebar } from "./components/app-sidebar"
import { Routes, useParams, Route } from "react-router"
import { NavBar } from "@/components/app-navbar"
import type { Chat, Message } from "./types"
import { createNewChat, getChatById, getMessageReply } from "./api/api"
import { ChatInput } from "./components/chat-input"

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home></Home>}></Route>
      <Route path="/chat/:id" element={<Home></Home>}></Route>
      <Route path="/chat" element={<Home></Home>}></Route>
    </Routes>
  )
}

export function Home() {
  const { id: paramId } = useParams()
  const queryClient = useQueryClient()
  const [chatId, setChatId] = useState<string>(paramId ?? "")
  const [messages, setMessages] = useState<Message[]>([])
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const { data: chat } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => getChatById(chatId),
    enabled: !!chatId,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: ({ chatId, msg }: { chatId: string; msg: string }) =>
      getMessageReply(chatId, msg),
    onSuccess: (response) => {
      setMessages((prev) => [...prev, { role: "assistant", content: response }])
      queryClient.invalidateQueries({ queryKey: ["history"] })
    },
  })

  const { mutate: createChat } = useMutation({
    mutationFn: createNewChat,
    onSuccess: (response: Chat) => {
      setChatId(response._id)
      setMessages(response.messages)
    },
  })

  const handleSend = async (text: string) => {
    const userMessage: Message = { role: "user", content: text }
    const newMessages = [...messages, userMessage]

    createChat(text)

    mutate({ chatId: chatId, msg: text })
    setMessages(newMessages)
  }

  function changeId(id: string) {
    setChatId(id)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <SidebarProvider>
      <div className="flex min-h-svh min-w-screen flex-col items-center justify-start px-4 py-6">
        <AppSidebar onIdChange={changeId} />
        <div className="mb-20 w-full max-w-2xl pt-16 pb-24">
          <NavBar
            onCreate={() => {
              setChatId("")
              setMessages([])
            }}
          ></NavBar>
          <div>
            {visibleMessages.length == 0 && (
              <div className="flex h-120 w-full flex-col items-center justify-center text-neutral-500">
                <HugeiconsIcon
                  icon={BrainIcon}
                  className="size-10"
                ></HugeiconsIcon>
                <h1 className="text-xl">Let's brain storm with Zeno</h1>
              </div>
            )}
            {visibleMessages.map((msg, idx) => {
              return (
                <div
                  className={`my-4 flex rounded-xl ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`${msg.role === "user" ? "rounded-2xl bg-neutral-100 px-4 py-3" : ""}`}
                  >
                    {msg.content}
                  </div>
                  {idx === visibleMessages.length - 1 && (
                    <div ref={bottomRef}></div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 text-sm text-neutral-400">
            {isPending && (
              <span className="flex animate-pulse items-center gap-2">
                <HugeiconsIcon icon={BrainIcon}></HugeiconsIcon>Thinking...
              </span>
            )}
          </div>
          <div className="fixed bottom-0 left-0 z-10 h-10 w-full backdrop-blur-xs"></div>
        </div>
        <ChatInput onSend={handleSend} isPending={isPending}></ChatInput>
      </div>
    </SidebarProvider>
  )
}

export default App
