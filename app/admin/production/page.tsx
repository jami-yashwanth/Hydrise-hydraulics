import { cookies } from "next/headers"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ProductionTable } from "@/components/admin/production-table"
import { getCurrentFY, clampMonthToFY, defaultMonthForFY, parseFY } from "@/lib/fy"

interface Props {
  searchParams: Promise<{ month?: string; customer?: string }>
}

export default async function ProductionPage({ searchParams }: Props) {
  const cookieStore = await cookies()
  const selectedFY = cookieStore.get("fy")?.value ?? getCurrentFY()

  const { month: monthQuery, customer: customerQuery } = await searchParams
  const rawMonth = monthQuery ?? defaultMonthForFY(selectedFY)
  const monthParam = clampMonthToFY(rawMonth, selectedFY)

  const [year, month] = monthParam.split("-").map(Number)
  const monthDate = new Date(year, month - 1, 1)
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const selectedCustomerId = customerQuery ?? ""

  const { start: fyStart, end: fyEnd } = parseFY(selectedFY)

  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, taxType: true } })

  const allEntries = await prisma.productionEntry.findMany({
    where: {
      chromePlatingDate: { gte: monthStart, lte: monthEnd },
    },
    include: {
      customer: true,
      employee: true,
      dc: { select: { dcNumber: true, financialYear: true } },
      invoice: { select: { invoiceNumber: true, financialYear: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const supersededIds = new Set(
    allEntries.filter((e) => e.redoOfId !== null).map((e) => e.redoOfId as string)
  )
  const latestEntries = allEntries.filter((e) => !supersededIds.has(e.id))

  const filtered = selectedCustomerId
    ? latestEntries.filter((e) => e.customerId === selectedCustomerId)
    : latestEntries

  const displayed = filtered.map((e, i) => ({ ...e, slNo: i + 1 }))

  const monthLabel = format(monthDate, "MMMM yyyy")

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Production</h1>
          <p className="text-sm text-muted-foreground">{monthLabel} · FY {selectedFY}</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/production/new">
            <Plus className="h-4 w-4 mr-1" /> New Entry
          </Link>
        </Button>
      </div>

      <ProductionTable
        entries={displayed}
        customers={customers}
        currentMonth={monthParam}
        selectedCustomerId={selectedCustomerId}
        currentFY={selectedFY}
      />
    </div>
  )
}
