import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createNewChat } from "@/api/api"

export function useCreateChatMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createNewChat,
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ["chats", "history"] })

      queryClient.setQueryData(["chats", "detail", newChat._id], newChat)
    },
  })
}
