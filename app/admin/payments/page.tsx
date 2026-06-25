import { cookies } from "next/headers"
import { format } from "date-fns"
import { prisma } from "@/lib/prisma"
import { getPaymentsByDateRange, getOutstandingInvoices, getPaymentsTotalByFY } from "@/lib/actions/invoices"
import { PaymentRegister } from "@/components/admin/payment-register"
import { getCurrentFY, parseFY } from "@/lib/fy"

interface Props {
  searchParams: Promise<{ from?: string; to?: string; customer?: string }>
}

export default async function PaymentsPage({ searchParams }: Props) {
  const cookieStore = await cookies()
  const selectedFY = cookieStore.get("fy")?.value ?? getCurrentFY()

  const { from: fromQuery, to: toQuery, customer: customerQuery } = await searchParams

  const { start: fyStart } = parseFY(selectedFY)
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const fyStartStr = format(fyStart, "yyyy-MM-dd")

  const fromParam = fromQuery ?? fyStartStr
  const toParam = toQuery ?? todayStr

  const selectedCustomerId = customerQuery ?? ""

  const [payments, customers, outstanding, fyTotal] = await Promise.all([
    getPaymentsByDateRange(fromParam, toParam),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getOutstandingInvoices(selectedCustomerId || undefined),
    getPaymentsTotalByFY(selectedFY, selectedCustomerId || undefined),
  ])

  const initialOutstandingTotal = outstanding.reduce((s, i) => s + i.balance, 0)

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Payment History</h1>
        <p className="text-sm text-muted-foreground">FY {selectedFY}</p>
      </div>

      <PaymentRegister
        payments={payments}
        customers={customers}
        fromDate={fromParam}
        toDate={toParam}
        selectedCustomerId={selectedCustomerId}
        currentFY={selectedFY}
        fyStartDate={fyStartStr}
        initialOutstandingTotal={initialOutstandingTotal}
        fyTotalReceived={fyTotal}
      />
    </div>
  )
}
