import { cookies } from "next/headers"
import { format } from "date-fns"
import { prisma } from "@/lib/prisma"
import { getInvoicesByMonth } from "@/lib/actions/invoices"
import { InvoiceRegister } from "@/components/admin/invoice-register"
import { getCurrentFY, clampMonthToFY, defaultMonthForFY } from "@/lib/fy"

interface Props {
  searchParams: Promise<{ month?: string; customer?: string; status?: string }>
}

export default async function InvoicesPage({ searchParams }: Props) {
  const cookieStore = await cookies()
  const selectedFY = cookieStore.get("fy")?.value ?? getCurrentFY()

  const { month: monthQuery, customer: customerQuery, status: statusQuery } = await searchParams
  const rawMonth = monthQuery ?? defaultMonthForFY(selectedFY)
  const monthParam = clampMonthToFY(rawMonth, selectedFY)

  const [year, month] = monthParam.split("-").map(Number)
  const monthDate = new Date(year, month - 1, 1)

  const [invoices, customers] = await Promise.all([
    getInvoicesByMonth(year, month),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ])

  const selectedCustomerId = customerQuery ?? ""
  const selectedStatus = statusQuery ?? ""

  const filtered = invoices.filter((inv) => {
    if (selectedCustomerId && inv.customerId !== selectedCustomerId) return false
    if (selectedStatus && inv.status !== selectedStatus) return false
    return true
  })

  const monthLabel = format(monthDate, "MMMM yyyy")

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="text-sm text-muted-foreground">{monthLabel} · FY {selectedFY}</p>
      </div>

      <InvoiceRegister
        invoices={filtered}
        customers={customers}
        currentMonth={monthParam}
        selectedCustomerId={selectedCustomerId}
        selectedStatus={selectedStatus}
        currentFY={selectedFY}
      />
    </div>
  )
}
