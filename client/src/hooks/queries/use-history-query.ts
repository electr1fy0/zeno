import { useQuery } from "@tanstack/react-query"
import { getChatHistory } from "@/api/api"

export function useHistoryQuery() {
  return useQuery({
    queryKey: ["chats", "history"],
    queryFn: getChatHistory,
  })
}
