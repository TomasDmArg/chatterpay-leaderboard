"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-[#204d34] text-white">
        <SheetHeader>
          <SheetTitle className="text-white">ChatterPay</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-8">
          <a href="#" className="flex items-center gap-2 py-2 hover:bg-[#0d352c] rounded-md px-2">
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-2 py-2 hover:bg-[#0d352c] rounded-md px-2">
            Leaderboard
          </a>
          <a href="#" className="flex items-center gap-2 py-2 hover:bg-[#0d352c] rounded-md px-2">
            Rules
          </a>
          <a href="#" className="flex items-center gap-2 py-2 hover:bg-[#0d352c] rounded-md px-2">
            Players
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
