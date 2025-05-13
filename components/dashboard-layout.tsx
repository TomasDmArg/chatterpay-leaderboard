"use client"

import type React from "react"
import { useEffect, useState } from "react"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isLargeDisplay, setIsLargeDisplay] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeDisplay(window.innerWidth >= 1920)
    }
    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  return (
    <div className={`min-h-screen bg-[#ecf7e8] ${isLargeDisplay ? "tv-mode" : ""}`}>
      <header className="bg-white border-b border-[#deecdc] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#204d34] flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="font-bold text-[#17442e] text-lg">ChatterPay</span>
          <span className="text-[#204d34] font-semibold text-lg">- Double or Nothing</span>
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
