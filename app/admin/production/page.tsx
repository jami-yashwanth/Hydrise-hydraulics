import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ProductionTable } from "@/components/admin/production-table"

interface Props {
  searchParams: Promise<{ month?: string; customer?: string }>
}

export default async function ProductionPage({ searchParams }: Props) {
  const { month: monthQuery, customer: customerQuery } = await searchParams
  // Default to current month
  const monthParam = monthQuery ?? format(new Date(), "yyyy-MM")
  const [year, month] = monthParam.split("-").map(Number)
  const monthDate = new Date(year, month - 1, 1)
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const selectedCustomerId = customerQuery ?? ""

  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, taxType: true } })

  // Get all entries for the month (will filter to "latest in chain" client-side)
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
    orderBy: { chromePlatingDate: "asc" },
  })

  // Find IDs that are pointed to by another entry's redoOfId (i.e., they are "superseded")
  const supersededIds = new Set(
    allEntries.filter((e) => e.redoOfId !== null).map((e) => e.redoOfId as string)
  )

  // Only show entries that are NOT superseded (latest in chain)
  const latestEntries = allEntries.filter((e) => !supersededIds.has(e.id))

  // Assign Sl. No. based on position in overall (unfiltered) latest list
  const withSlNo = latestEntries.map((e, i) => ({ ...e, slNo: i + 1 }))

  // Apply customer filter for display
  const displayed = selectedCustomerId
    ? withSlNo.filter((e) => e.customerId === selectedCustomerId)
    : withSlNo

  const monthLabel = format(monthDate, "MMMM yyyy")

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Production</h1>
          <p className="text-sm text-muted-foreground">{monthLabel}</p>
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
      />
    </div>
  )
}
