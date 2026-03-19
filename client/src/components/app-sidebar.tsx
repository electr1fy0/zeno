import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useQuery } from "@tanstack/react-query"

type HistoryItem = {
  title: string
}
async function getChatHistory(): Promise<HistoryItem[]> {
  const history = await fetch("http://localhost:3000/history")

  return history.json()
}

export function AppSidebar() {
  const query = useQuery({
    queryKey: ["history"],
    queryFn: getChatHistory,
  })

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          {query.data?.map((item: HistoryItem) => {
            return <li>{item.title}</li>
          })}
        </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
