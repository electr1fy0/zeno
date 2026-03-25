import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createNewChat } from "@/api/api"

type CreateChatParams = {
  message: string
  onMeta?: (chatId: string) => void
  onChunk?: (chunk: string) => void
}

export function useCreateChatMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ message, onMeta, onChunk }: CreateChatParams) =>
      createNewChat(message, { onMeta, onChunk }),
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ["chats", "history"] })

      queryClient.setQueryData(["chats", "detail", newChat._id], newChat)
    },
  })
}
