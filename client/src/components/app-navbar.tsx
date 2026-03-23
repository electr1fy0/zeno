import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "./ui/button"
import { SidebarTrigger } from "./ui/sidebar"
import { PencilEdit01Icon } from "@hugeicons/core-free-icons"

export function NavBar({ onCreate }: { onCreate: () => void }) {
  return (
    <nav className="fixed top-0 left-1/2 z-30 flex w-full max-w-2xl -translate-x-1/2 justify-between bg-white/95 pt-3 pb-2 backdrop-blur-sm">
      <Button
        variant="secondary"
        className="size-11 rounded-full text-neutral-600"
      >
        <SidebarTrigger>
          {/*<HugeiconsIcon icon={Hamburger} strokeWidth={2}></HugeiconsIcon>*/}
        </SidebarTrigger>
      </Button>
      <Button
        variant="secondary"
        className="size-11 rounded-full text-neutral-600"
        onClick={onCreate}
      >
        <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2}></HugeiconsIcon>
      </Button>
    </nav>
  )
}
