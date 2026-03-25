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
      sendMessage(chatId, message, {
        onChunk: (chunk) => {
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
      }),
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

        const assistantMessage: Message = {
          role: "assistant",
          content: "",
        }

        queryClient.setQueryData(["chats", "detail", chatId], {
          ...previousChat,
          messages: [...previousChat.messages, userMessage, assistantMessage],
        })
      }

      return { previousChat }
    },
    onSuccess: (aiResponse, { chatId }) => {
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
            content: aiResponse,
          }

          return {
            ...currentChat,
            messages,
          }
        }
      )

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
