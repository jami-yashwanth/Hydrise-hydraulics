export const dynamic = "force-dynamic"

import type { ReactNode } from "react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { SessionProvider } from "@/components/admin/session-provider"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}
