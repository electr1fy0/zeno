import { useQuery } from "@tanstack/react-query"
import { getChatById } from "@/api/api"
import { queryKeys } from "@/lib/query-client"

export function useChatQuery(chatId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chats.detail(chatId || ""),
    queryFn: () => getChatById(chatId!),
    enabled: !!chatId,
  })
}
