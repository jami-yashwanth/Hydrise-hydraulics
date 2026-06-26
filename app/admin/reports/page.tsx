import { format } from "date-fns"
import { prisma } from "@/lib/prisma"
import { getInvoicesByDateRange, getOutstandingByCustomer } from "@/lib/actions/invoices"
import { InvoiceReport } from "@/components/admin/invoice-report"
import { getCurrentFY } from "@/lib/fy"

interface Props {
  searchParams: Promise<{ from?: string; to?: string; customer?: string; status?: string }>
}

export default async function ReportsPage({ searchParams }: Props) {
  const { from: fromQuery, to: toQuery, customer: customerQuery, status: statusQuery } = await searchParams

  const currentFY = getCurrentFY()
  const fyStartYear = parseInt(currentFY.split("-")[0])
  const defaultFrom = `${fyStartYear}-04-01`
  const defaultTo = format(new Date(), "yyyy-MM-dd")

  const from = fromQuery ?? defaultFrom
  const to = toQuery ?? defaultTo

  const [invoices, customers, outstandingByCustomer] = await Promise.all([
    getInvoicesByDateRange(from, to),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getOutstandingByCustomer(),
  ])

  const selectedCustomerId = customerQuery ?? ""
  const selectedStatus = statusQuery ?? ""

  const filtered = invoices.filter((inv) => {
    if (selectedCustomerId && inv.customerId !== selectedCustomerId) return false
    if (selectedStatus && inv.status !== selectedStatus) return false
    return true
  })

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Invoice report with all-time outstanding summary</p>
      </div>

      <InvoiceReport
        invoices={filtered}
        customers={customers}
        from={from}
        to={to}
        selectedCustomerId={selectedCustomerId}
        selectedStatus={selectedStatus}
        outstandingByCustomer={outstandingByCustomer}
      />
    </div>
  )
}
