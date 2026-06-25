import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { DCTable } from "@/components/admin/dc-table"
import { getCurrentFY, clampMonthToFY, defaultMonthForFY } from "@/lib/fy"

interface Props {
  searchParams: Promise<{ month?: string; customer?: string }>
}

export default async function DCsPage({ searchParams }: Props) {
  const cookieStore = await cookies()
  const selectedFY = cookieStore.get("fy")?.value ?? getCurrentFY()

  const { month: monthQuery, customer: customerQuery } = await searchParams
  const rawMonth = monthQuery ?? defaultMonthForFY(selectedFY)
  const monthParam = clampMonthToFY(rawMonth, selectedFY)
  const selectedCustomerId = customerQuery ?? ""

  const [year, month] = monthParam.split("-").map(Number)
  const monthDate = new Date(year, month - 1, 1)

  const [rawDcs, customers] = await Promise.all([
    prisma.dC.findMany({
      where: {
        dcDate: { gte: startOfMonth(monthDate), lte: endOfMonth(monthDate) },
        ...(selectedCustomerId ? { customerId: selectedCustomerId } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, taxType: true } },
        entries: { select: { invoiceId: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, taxType: true } }),
  ])

  const dcs = rawDcs.map((dc) => ({
    id: dc.id,
    dcNumber: dc.dcNumber,
    financialYear: dc.financialYear,
    dcDate: dc.dcDate,
    customer: dc.customer,
    entryCount: dc.entries.length,
    hasInvoicedEntries: dc.entries.some((e) => e.invoiceId !== null),
  }))

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Delivery Challans</h1>
          <p className="text-sm text-muted-foreground">{format(monthDate, "MMMM yyyy")} · FY {selectedFY}</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <DCTable
          dcs={dcs}
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          currentMonth={monthParam}
          currentFY={selectedFY}
        />
      </div>
    </div>
  )
}
