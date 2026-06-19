import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { DCMonthNav } from "@/components/admin/dc-month-nav"

interface Props {
  searchParams: Promise<{ month?: string }>
}

export default async function DCsPage({ searchParams }: Props) {
  const { month: monthQuery } = await searchParams
  const monthParam = monthQuery ?? format(new Date(), "yyyy-MM")
  const [year, month] = monthParam.split("-").map(Number)
  const monthDate = new Date(year, month - 1, 1)

  const dcs = await prisma.dC.findMany({
    where: {
      dcDate: { gte: startOfMonth(monthDate), lte: endOfMonth(monthDate) },
    },
    include: {
      customer: { select: { name: true } },
      _count: { select: { entries: true } },
    },
    orderBy: [{ financialYear: "asc" }, { dcNumber: "asc" }],
  })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Delivery Challans</h1>
          <p className="text-sm text-muted-foreground">{format(monthDate, "MMMM yyyy")}</p>
        </div>
      </div>

      <DCMonthNav currentMonth={monthParam} />

      <div className="bg-white border rounded-lg overflow-hidden">
        {dcs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No delivery challans for this period.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">DC No.</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">FY</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {dcs.map((dc) => (
                <tr
                  key={dc.id}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-center font-mono font-semibold">
                    <Link href={`/admin/dcs/${dc.id}`} className="text-blue-700 hover:underline">
                      #{dc.dcNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{dc.financialYear}</td>
                  <td className="px-4 py-3 text-center">{format(new Date(dc.dcDate), "dd.MM.yyyy")}</td>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/dcs/${dc.id}`} className="hover:underline">
                      {dc.customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{dc._count.entries} Nos.</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
