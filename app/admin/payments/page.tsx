import { cookies } from "next/headers"
import { format } from "date-fns"
import { prisma } from "@/lib/prisma"
import { getPaymentsByMonth, getOutstandingInvoices, getPaymentsTotalByFY, getOutstandingByFY } from "@/lib/actions/invoices"
import { PaymentRegister } from "@/components/admin/payment-register"
import { getCurrentFY, clampMonthToFY, defaultMonthForFY } from "@/lib/fy"

interface Props {
  searchParams: Promise<{ month?: string; customer?: string }>
}

export default async function PaymentsPage({ searchParams }: Props) {
  const cookieStore = await cookies()
  const selectedFY = cookieStore.get("fy")?.value ?? getCurrentFY()

  const { month: monthQuery, customer: customerQuery } = await searchParams
  const rawMonth = monthQuery ?? defaultMonthForFY(selectedFY)
  const monthParam = clampMonthToFY(rawMonth, selectedFY)

  const [year, month] = monthParam.split("-").map(Number)
  const monthDate = new Date(year, month - 1, 1)

  const selectedCustomerId = customerQuery ?? ""

  const [payments, customers, outstanding, fyTotal, fyOutstanding] = await Promise.all([
    getPaymentsByMonth(year, month),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getOutstandingInvoices(selectedCustomerId || undefined),
    getPaymentsTotalByFY(selectedFY, selectedCustomerId || undefined),
    getOutstandingByFY(selectedFY, selectedCustomerId || undefined),
  ])

  const initialOutstandingTotal = outstanding.reduce((s, i) => s + i.balance, 0)
  const initialFYOutstandingTotal = fyOutstanding.reduce((s, i) => s + i.balance, 0)
  const monthLabel = format(monthDate, "MMMM yyyy")

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Payment History</h1>
        <p className="text-sm text-muted-foreground">{monthLabel} · FY {selectedFY}</p>
      </div>

      <PaymentRegister
        payments={payments}
        customers={customers}
        currentMonth={monthParam}
        selectedCustomerId={selectedCustomerId}
        currentFY={selectedFY}
        initialOutstandingTotal={initialOutstandingTotal}
        fyTotalReceived={fyTotal}
        initialFYOutstandingTotal={initialFYOutstandingTotal}
      />
    </div>
  )
}
