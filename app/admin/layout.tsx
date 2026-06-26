export const dynamic = "force-dynamic"

import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { AdminSidebar } from "@/components/admin/sidebar"
import { SessionProvider } from "@/components/admin/session-provider"
import { InactivityGuard } from "@/components/admin/inactivity-guard"
import { getCurrentFY } from "@/lib/fy"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const selectedFY = cookieStore.get("fy")?.value ?? getCurrentFY()

  return (
    <SessionProvider>
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar currentFY={selectedFY} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <InactivityGuard />
    </SessionProvider>
  )
}
