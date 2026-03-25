import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "./ui/button"
import { ArrowUp } from "@hugeicons/core-free-icons"
import { Input } from "./ui/input"
import { useState } from "react"

export function ChatInput({
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
        type="submit"
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
