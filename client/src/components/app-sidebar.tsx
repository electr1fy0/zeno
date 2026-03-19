import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { useQuery } from "@tanstack/react-query"

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "")

type HistoryItem = {
  id: string
  title: string
}
async function getChatHistory(): Promise<HistoryItem[]> {
  const history = await fetch(`${API_BASE_URL}/history`)

  return history.json()
}

export function AppSidebar({
  onIdChange,
}: {
  onIdChange: (id: string) => void
}) {
  const query = useQuery({
    queryKey: ["history"],
    queryFn: getChatHistory,
  })

  const { toggleSidebar } = useSidebar()
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          {query.data?.map((item: HistoryItem) => {
            return (
              <li key={item.id}>
                <div
                  className="my-1 w-full px-4 py-2 text-base text-neutral-500 hover:bg-neutral-100 focus-visible:ring-0 focus-visible:outline-0"
                  onClick={() => {
                    onIdChange(item.id)

                    toggleSidebar()
                  }}
                >
                  {item.title}
                </div>
              </li>
            )
          })}
        </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
