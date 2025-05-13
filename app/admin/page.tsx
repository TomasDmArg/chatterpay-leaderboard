import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminPanel } from "@/components/admin-panel"

export default function AdminPage() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <AdminPanel />
      </div>
    </DashboardLayout>
  )
}
