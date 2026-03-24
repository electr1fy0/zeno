import { useQuery } from "@tanstack/react-query"
import { getChatHistory } from "@/api/api"
import { queryKeys } from "@/lib/query-client"

export function useHistoryQuery() {
  return useQuery({
    queryKey: queryKeys.chats.history(),
    queryFn: getChatHistory,
  })
}
