import { BrainIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { SidebarProvider } from "./components/ui/sidebar"
import { AppSidebar } from "./components/app-sidebar"
import { Routes, useParams, Route, useNavigate } from "react-router"
import { NavBar } from "@/components/app-navbar"
import { ChatInput } from "./components/chat-input"
import { useChatQuery } from "./hooks/queries/use-chat-query"
import { useCreateChatMutation } from "./hooks/mutations/use-create-chat"
import { useSendMessageMutation } from "./hooks/mutations/use-send-message"
import type { Chat, Message } from "./types"
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
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const streamingChatIdRef = useRef<string | null>(null)
  const [pendingNewChatMessage, setPendingNewChatMessage] =
    useState<Message | null>(null)

  const { data: chat } = useChatQuery(paramId)

  const createChat = useCreateChatMutation()
  const sendMessageMutation = useSendMessageMutation()

  const isPending = createChat.isPending || sendMessageMutation.isPending
  const messages =
    chat?.messages ??
    (!paramId && pendingNewChatMessage ? [pendingNewChatMessage] : [])
  const lastMessage = messages.at(-1)

  const handleSend = async (text: string) => {
    if (!paramId) {
      setPendingNewChatMessage({
        role: "user",
        content: text,
      })

      createChat.mutate(
        {
          message: text,
          onMeta: (chatId) => {
            streamingChatIdRef.current = chatId
            setPendingNewChatMessage(null)
            queryClient.setQueryData(["chats", "detail", chatId], {
              _id: chatId,
              messages: [
                {
                  role: "user",
                  content: text,
                },
                {
                  role: "assistant",
                  content: "",
                },
              ],
            })
            navigate(`/chat/${chatId}`, { replace: true })
          },
          onChunk: (chunk) => {
            const chatId = streamingChatIdRef.current
            if (!chatId) return

            queryClient.setQueryData(
              ["chats", "detail", chatId],
              (currentChat: Chat | undefined) => {
                if (!currentChat) return currentChat

                const messages = [...currentChat.messages]
                const lastMessage = messages.at(-1)

                if (!lastMessage || lastMessage.role !== "assistant") {
                  return currentChat
                }

                messages[messages.length - 1] = {
                  ...lastMessage,
                  content: lastMessage.content + chunk,
                }

                return {
                  ...currentChat,
                  messages,
                }
              }
            )
          },
        },
        {
          onSuccess: (newChat) => {
            setPendingNewChatMessage(null)
            streamingChatIdRef.current = null
            navigate(`/chat/${newChat._id}`, { replace: true })
          },
          onError: () => {
            setPendingNewChatMessage(null)
            streamingChatIdRef.current = null
          },
        }
      )
    } else {
      sendMessageMutation.mutate({ chatId: paramId, message: text })
    }
  }

  const handleNewChat = () => {
    setPendingNewChatMessage(null)
    streamingChatIdRef.current = null
    navigate("/chat", { replace: true })
  }

  const handleChatChange = (id: string) => {
    setPendingNewChatMessage(null)
    streamingChatIdRef.current = null
    navigate(`/chat/${id}`)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [lastMessage?.content, lastMessage?.role, messages.length])

  return (
    <SidebarProvider>
      <div className="flex min-h-svh min-w-screen flex-col items-center justify-start px-4 py-6">
        <AppSidebar onIdChange={handleChatChange} />
        <div className="mb-20 w-full max-w-2xl pt-16 pb-24">
          <NavBar onCreate={handleNewChat}></NavBar>
          <div>
            {messages.length === 0 && (
              <div className="flex h-120 w-full flex-col items-center justify-center text-neutral-500">
                <HugeiconsIcon
                  icon={BrainIcon}
                  className="size-10"
                ></HugeiconsIcon>
                <h1 className="text-xl">Let's brain storm with Zeno</h1>
              </div>
            )}
            {messages.map((msg, idx) => {
              return (
                <div
                  key={idx}
                  className={`my-4 flex rounded-xl text-base whitespace-pre-wrap text-neutral-600 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`${msg.role === "user" ? "rounded-2xl bg-neutral-100 px-4 py-3" : ""}`}
                  >
                    {msg.content}
                  </div>
                  {idx === messages.length - 1 && <div ref={bottomRef}></div>}
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
