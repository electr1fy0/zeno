import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createNewChat } from "@/api/api"
import { queryKeys } from "@/lib/query-client"

export function useCreateChatMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createNewChat,
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.history() })

      queryClient.setQueryData(queryKeys.chats.detail(newChat._id), newChat)
    },
  })
}
