import { Button } from "@/components/ui/button"
import { Input } from "./components/ui/input"
import { ArrowUp } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"

async function getAiResponse(msg: string): Promise<string> {
  const resp = await fetch("http://localhost:3000/chat/32", {
    method: "post",
    body: JSON.stringify({ message: msg }),
    headers: { "Content-Type": "application/json" },
  })

  if (!resp.ok) throw new Error("failed to fetch ai resp")

  const data = await resp.text()
  console.log("resp", data)

  return data
}

export function App() {
  const [inputMsg, setInputMsg] = useState("")
  const { mutate, data, isPending } = useMutation({
    mutationFn: (msg: string) => getAiResponse(msg),
  })

  return (
    <div className="flex min-h-svh min-w-screen items-center justify-center py-6">
      <div>{data && <span> {data}</span>}</div>
      <div>{isPending && <span> Loading...</span>}</div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          mutate(inputMsg)
        }}
        className="fixed bottom-6 left-1/2 flex w-[calc(100%-3rem)] max-w-2xl -translate-x-1/2 items-center gap-1 rounded-full border border-neutral-300 bg-neutral-50 px-3 py-2 shadow-sm"
      >
        <Input
          type="text"
          placeholder="Ask anything"
          className="w-full border-none focus:ring-0 focus-visible:ring-0 md:text-base"
          onChange={(e) => setInputMsg(e.target.value)}
        ></Input>
        <Button
          size="icon"
          className="size-9 rounded-full bg-neutral-200"
          onClick={() => mutate(inputMsg)}
        >
          <HugeiconsIcon
            icon={ArrowUp}
            className="text-neutral-600"
            strokeWidth={3}
          ></HugeiconsIcon>
        </Button>
      </form>
    </div>
  )
}

export default App
