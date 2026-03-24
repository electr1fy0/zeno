import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { useHistoryQuery } from "@/hooks/queries/use-history-query"

export function AppSidebar({
  onIdChange,
}: {
  onIdChange: (id: string) => void
}) {
  const { data: history, isLoading } = useHistoryQuery()
  const { toggleSidebar } = useSidebar()

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          {isLoading && (
            <div className="px-4 py-2 text-sm text-neutral-400">Loading...</div>
          )}
          {history?.map((item) => {
            return (
              <li key={item._id}>
                <div
                  className="my-1 w-full cursor-pointer px-4 py-2 text-base text-neutral-500 hover:bg-neutral-100 focus-visible:ring-0 focus-visible:outline-0"
                  onClick={() => {
                    onIdChange(item._id)
                    toggleSidebar()
                  }}
                >
                  {item.title || "Untitled Chat"}
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
