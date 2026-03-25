import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sendMessage } from "@/api/api"
import type { Chat, Message } from "@/types"

type SendMessageParams = {
  chatId: string
  message: string
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chatId, message }: SendMessageParams) =>
      sendMessage(chatId, message),
    onMutate: async ({ chatId, message }) => {
      await queryClient.cancelQueries({
        queryKey: ["chats", "detail", chatId],
      })

      const previousChat: Chat | undefined = queryClient.getQueryData([
        "chats",
        "detail",
        chatId,
      ])

      if (previousChat) {
        const userMessage: Message = {
          role: "user",
          content: message,
        }

        queryClient.setQueryData(["chats", "detail", chatId], {
          ...previousChat,
          messages: [...previousChat.messages, userMessage],
        })
      }

      return { previousChat }
    },
    onSuccess: (aiResponse, { chatId }) => {
      const currentChat: Chat | undefined = queryClient.getQueryData([
        "chats",
        "detail",
        chatId,
      ])

      if (currentChat) {
        const aiMessage: Message = {
          role: "assistant",
          content: aiResponse,
        }

        queryClient.setQueryData(["chats", "detail", chatId], {
          ...currentChat,
          messages: [...currentChat.messages, aiMessage],
        })
      }

      queryClient.invalidateQueries({ queryKey: ["chats", "history"] })
    },
    onError: (_error, { chatId }, context) => {
      if (context?.previousChat) {
        queryClient.setQueryData(
          ["chats", "detail", chatId],
          context.previousChat
        )
      }
    },
  })
}
