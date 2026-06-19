"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Users, UserCog, ClipboardList, LogOut, FileText, Truck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/production", label: "Production", icon: ClipboardList },
  { href: "/admin/dcs", label: "Delivery Challans", icon: Truck },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/employees", label: "Employees", icon: UserCog },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 border-r bg-white flex flex-col shrink-0">
      <div className="p-4 border-b">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Hydrise Hydraulics</p>
        <p className="font-semibold text-sm">Admin Portal</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-gray-600 hover:text-gray-900"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
