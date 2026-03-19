import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useQuery } from "@tanstack/react-query"
import { Button } from "./ui/button"

type HistoryItem = {
  id: string
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
            return (
              <li key={item.id}>
                <div
                  className="my-1 w-full px-4 py-2 text-base text-neutral-500 hover:bg-neutral-100 focus-visible:ring-0 focus-visible:outline-0"
                  onClick={() => {
                    console.log("click")
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
