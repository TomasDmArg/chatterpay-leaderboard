import { DashboardLayout } from "@/components/dashboard-layout"
import { Leaderboard } from "@/components/leaderboard"
import { RulesSection } from "@/components/rules-section"
import { QRCodeSVG } from 'qrcode.react';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6 tv-container">
        <div>
          <RulesSection />
        </div>
        <div>
          <Leaderboard />
        </div>
      </div>
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center bg-white rounded-xl shadow-lg p-4 border border-[#e0fbe0]">
        <QRCodeSVG value="https://chatterpay.net" size={150} bgColor="#e0fbe0" fgColor="#17442e" />
        <span className="mt-2 text-xs text-[#17442e] font-semibold">Scan to visit ChatterPay</span>
      </div>
    </DashboardLayout>
  )
}
