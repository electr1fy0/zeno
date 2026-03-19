import { Button } from "@/components/ui/button"
import { Input } from "./components/ui/input"
import {
  ArrowUp,
  Brain,
  BrainIcon,
  Hamburger,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

interface Chat {
  messages: Message[]
}

type Message = {
  role: string
  content: string
}

async function getAiResponse(chatId: string, msg: string): Promise<string> {
  const resp = await fetch(
    `http://localhost:3000/chat/${encodeURIComponent(chatId)}`,
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

async function createChat(): Promise<string> {
  const resp = await fetch("http://localhost:3000/chat", {
    method: "get",
  })
  if (!resp.ok) throw new Error("failed to create a chat")
  return resp.text()
}

function NavBar({ onCreate }: { onCreate: () => void }) {
  return (
    <nav className="fixed top-0 left-1/2 z-30 flex w-full max-w-2xl -translate-x-1/2 justify-between bg-white/95 pt-3 pb-2 backdrop-blur-sm">
      <Button
        variant="secondary"
        className="size-11 rounded-full text-neutral-600"
      >
        <HugeiconsIcon icon={Hamburger} strokeWidth={2}></HugeiconsIcon>
      </Button>
      <Button
        variant="secondary"
        className="size-11 rounded-full text-neutral-600"
        onClick={onCreate}
      >
        <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2}></HugeiconsIcon>
      </Button>
    </nav>
  )
}

function ChatInput({
  onSend,
  isPending,
}: {
  onSend: (msg: string) => void
  isPending: boolean
}) {
  const [inputMsg, setInputMsg] = useState("")

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (isPending || inputMsg.trim() == "") return
        onSend(inputMsg.trim())
        setInputMsg("")
      }}
      className="fixed bottom-6 left-1/2 z-20 flex w-[calc(100%-3rem)] max-w-2xl -translate-x-1/2 items-center gap-1 rounded-full border border-neutral-300 bg-neutral-50 px-3 py-2 shadow-sm"
    >
      <Input
        type="text"
        placeholder="Ask anything"
        className="w-full border-none focus:ring-0 focus-visible:ring-0 md:text-base"
        onChange={(e) => setInputMsg(e.target.value)}
        value={inputMsg}
        disabled={isPending}
      ></Input>
      <Button
        size="icon"
        className="size-9 rounded-full bg-neutral-200"
        disabled={isPending}
      >
        <HugeiconsIcon
          icon={ArrowUp}
          className="text-neutral-600"
          strokeWidth={3}
        ></HugeiconsIcon>
      </Button>
    </form>
  )
}

export function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: "don't use any markdown formatting in your output",
    },
  ])

  const bottomRef = useRef<HTMLDivElement | null>(null)
  const [chatId, setChatId] = useState<string>("")

  const { mutate, isPending } = useMutation({
    mutationFn: ({ chatId, msg }: { chatId: string; msg: string }) =>
      getAiResponse(chatId, msg),
    onSuccess: (response) => {
      setMessages((prev) => [...prev, { role: "assistant", content: response }])
    },
  })

  const { mutate: mutateChat } = useMutation({
    mutationFn: createChat,
    onSuccess: (response: string) => {
      setChatId(response)
      setMessages([])
    },
  })

  const handleSend = async (text: string) => {
    const userMessage: Message = { role: "user", content: text }
    const newMessages = [...messages, userMessage]

    let id = chatId
    if (chatId === "") {
      id = await createChat()
      setChatId(id)
    }

    setMessages(newMessages)
    mutate({ chatId: id, msg: text })
  }
  const visibleMessages = messages.filter((m) => m.role !== "system")
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  return (
    <div className="flex min-h-svh min-w-screen flex-col items-center justify-start px-4 py-6">
      <div className="mb-20 w-full max-w-2xl pt-16 pb-24">
        <NavBar onCreate={mutateChat}></NavBar>
        <div>
          {visibleMessages.length == 0 && (
            <div className="flex h-[40rem] w-full flex-col items-center justify-center text-neutral-500">
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
  )
}

export default App
