import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { useHistoryQuery } from "@/hooks/queries/use-history-query"
import { Input } from "./ui/input"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import clsx from "clsx"
import { useParams } from "react-router"

export function AppSidebar({
  onIdChange,
}: {
  onIdChange: (id: string) => void
}) {
  const { data: history, isLoading } = useHistoryQuery()
  const { toggleSidebar } = useSidebar()
  const { id: paramId } = useParams()
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          {isLoading && (
            <div className="px-4 py-2 text-sm text-neutral-400">Loading...</div>
          )}
          <div className="my-4 flex items-center justify-baseline gap-1 rounded-xl bg-neutral-100 px-3 py-0.5 text-sm text-neutral-600">
            <HugeiconsIcon
              icon={Search01Icon}
              size="20"
              strokeWidth={1.5}
            ></HugeiconsIcon>
            <Input
              placeholder="Search Chats"
              className="border-0 focus-visible:ring-0"
            ></Input>
          </div>
          {history?.map((item) => {
            return (
              <li key={item._id}>
                <div
                  className={clsx(
                    "my-1 w-full cursor-pointer rounded-xl px-4 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 focus-visible:ring-0 focus-visible:outline-0",
                    item._id === paramId ? "bg-neutral-100" : ""
                  )}
                  onClick={() => {
                    onIdChange(item._id)
                    // toggleSidebar()
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
