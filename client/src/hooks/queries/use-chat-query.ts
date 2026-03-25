import { useQuery } from "@tanstack/react-query"
import { getChatById } from "@/api/api"

export function useChatQuery(chatId: string | undefined) {
  return useQuery({
    queryKey: ["chats", "detail", chatId],
    queryFn: () => getChatById(chatId!),
    enabled: !!chatId,
  })
}
