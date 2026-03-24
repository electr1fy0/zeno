import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

// Query keys factory
export const queryKeys = {
  chats: {
    all: ["chats"] as const,
    history: () => [...queryKeys.chats.all, "history"] as const,
    detail: (id: string) => [...queryKeys.chats.all, "detail", id] as const,
  },
}
