import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCog, ClipboardList, CheckCircle2, Clock, XCircle } from "lucide-react"
import { startOfMonth, endOfMonth } from "date-fns"
import { FinancialCards, type InvoiceRow, type UnbilledCustomerRow } from "@/components/admin/financial-cards"

export default async function AdminDashboard() {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [
    customers,
    employees,
    totalProduction,
    monthProduction,
    statusCounts,
    monthInvoiceAgg,
    totalInvoiced,
    totalPaid,
    unbilledAmount,
    monthInvoiceDetails,
    allInvoiceDetails,
    unbilledEntries,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.employee.count(),
    prisma.productionEntry.count(),
    prisma.productionEntry.count({
      where: { chromePlatingDate: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.productionEntry.groupBy({
      by: ["status"],
      _count: true,
      where: { chromePlatingDate: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.invoice.aggregate({
      where: { invoiceDate: { gte: monthStart, lte: monthEnd } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.invoice.aggregate({ _sum: { totalAmount: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.productionEntry.aggregate({
      where: { invoiceId: null, status: { not: "FAILED" } },
      _sum: { totalCost: true },
    }),
    prisma.invoice.findMany({
      where: { invoiceDate: { gte: monthStart, lte: monthEnd } },
      include: { customer: { select: { name: true } }, payments: true },
      orderBy: { invoiceNumber: "asc" },
    }),
    prisma.invoice.findMany({
      include: { customer: { select: { name: true } }, payments: true },
      orderBy: { invoiceDate: "asc" },
    }),
    prisma.productionEntry.findMany({
      where: { invoiceId: null, status: { not: "FAILED" } },
      select: { customerId: true, totalCost: true, customer: { select: { name: true } } },
    }),
  ])

  const successCount = statusCounts.find((s) => s.status === "SUCCESS")?._count ?? 0
  const pendingCount = statusCounts.find((s) => s.status === "PENDING")?._count ?? 0
  const failedCount = statusCounts.find((s) => s.status === "FAILED")?._count ?? 0

  const monthBilled = monthInvoiceAgg._sum.totalAmount ?? 0
  const monthInvoiceCount = monthInvoiceAgg._count
  const receivables = Math.max(
    0,
    (totalInvoiced._sum.totalAmount ?? 0) - (totalPaid._sum.amount ?? 0)
  )
  const unbilled = unbilledAmount._sum.totalCost ?? 0

  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" })

  const toInvoiceRow = (inv: typeof monthInvoiceDetails[0]): InvoiceRow => {
    const paid = inv.payments.reduce((s, a) => s + a.amount, 0)
    const balance = parseFloat((inv.totalAmount - paid).toFixed(2))
    const status: InvoiceRow["status"] =
      paid === 0 ? "UNPAID" : balance <= 0 ? "PAID" : "PARTIAL"
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      financialYear: inv.financialYear,
      invoiceDate: inv.invoiceDate.toISOString(),
      customerName: inv.customer.name,
      totalAmount: inv.totalAmount,
      paid,
      balance,
      status,
    }
  }

  const monthInvoiceRows = monthInvoiceDetails.map(toInvoiceRow)
  const outstandingRows = allInvoiceDetails.map(toInvoiceRow).filter((r) => r.balance > 0)

  const customerMap = new Map<string, { customerName: string; count: number; total: number }>()
  for (const entry of unbilledEntries) {
    const existing = customerMap.get(entry.customerId)
    if (existing) {
      existing.count++
      existing.total += entry.totalCost
    } else {
      customerMap.set(entry.customerId, { customerName: entry.customer.name, count: 1, total: entry.totalCost })
    }
  }
  const unbilledByCustomer: UnbilledCustomerRow[] = Array.from(customerMap.entries())
    .map(([customerId, data]) => ({ customerId, ...data }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{monthName}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Employees</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{employees}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monthProduction}</p>
            <p className="text-xs text-muted-foreground">{totalProduction} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span>{successCount} Success</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-yellow-500" />
              <span>{pendingCount} Pending</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span>{failedCount} Failed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <FinancialCards
        monthBilled={monthBilled}
        monthInvoiceCount={monthInvoiceCount}
        receivables={receivables}
        unbilled={unbilled}
        monthInvoices={monthInvoiceRows}
        outstandingInvoices={outstandingRows}
        unbilledByCustomer={unbilledByCustomer}
      />
    </div>
  )
}
