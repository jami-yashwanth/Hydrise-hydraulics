import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { updateProductionEntry } from "@/lib/actions/production"
import { ProductionForm } from "@/components/admin/production-form"
import { RedoJobButton } from "@/components/admin/redo-job-button"
import { format } from "date-fns"
import { CheckCircle2, Clock, XCircle, ArrowRight, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

async function getChain(entryId: string): Promise<Array<{ id: string; status: string; chromePlatingDate: Date; totalCost: number }>> {
  // Walk back to root
  const entry = await prisma.productionEntry.findUnique({ where: { id: entryId } })
  if (!entry) return []

  type EntryRow = NonNullable<typeof entry>
  const chain: EntryRow[] = []
  let current: EntryRow | null = entry

  // Walk to root
  while (current?.redoOfId) {
    const parent: EntryRow | null = await prisma.productionEntry.findUnique({ where: { id: current.redoOfId } })
    if (!parent) break
    chain.unshift(parent)
    current = parent
  }
  chain.push(entry)
  return chain
}

export default async function ProductionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await prisma.productionEntry.findUnique({
    where: { id },
    include: {
      customer: true,
      employee: true,
      dc: { select: { dcNumber: true, financialYear: true } },
      invoice: { select: { invoiceNumber: true, financialYear: true } },
    },
  })

  if (!entry) notFound()

  const [customers, employees, chain] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.employee.findMany({ orderBy: { name: "asc" } }),
    getChain(entry.id),
  ])

  const action = updateProductionEntry.bind(null, entry.id)
  const isLatest = !await prisma.productionEntry.findFirst({ where: { redoOfId: entry.id } })

  function StatusIcon({ status }: { status: string }) {
    if (status === "SUCCESS") return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
    if (status === "FAILED") return <XCircle className="h-3.5 w-3.5 text-red-500" />
    return <Clock className="h-3.5 w-3.5 text-yellow-500" />
  }

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Production Entry</h1>
          <p className="text-sm text-muted-foreground">{entry.customer.name} — {format(new Date(entry.chromePlatingDate), "dd MMM yyyy")}</p>
        </div>
        {entry.status === "FAILED" && isLatest && (
          <RedoJobButton originalId={entry.id} />
        )}
      </div>

      {/* Retry chain — only show if there were failures */}
      {chain.length > 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-2">Attempt History</p>
          <div className="flex flex-wrap items-center gap-2">
            {chain.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2">
                <Link
                  href={`/admin/production/${c.id}`}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    c.id === entry.id
                      ? "bg-white border-gray-300 font-medium pointer-events-none"
                      : "bg-transparent border-amber-300 hover:bg-amber-100 cursor-pointer"
                  }`}
                >
                  <StatusIcon status={c.status} />
                  <span>
                    Attempt {i + 1} · {format(new Date(c.chromePlatingDate), "dd MMM")}
                    {c.totalCost > 0 ? ` · ₹${c.totalCost.toLocaleString("en-IN")}` : ""}
                  </span>
                </Link>
                {i < chain.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {entry.invoiceId && entry.invoice && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          <FileText className="h-4 w-4 shrink-0" />
          This entry is included in Invoice{" "}
          <a href={`/admin/invoices/${entry.invoiceId}`} className="font-semibold underline underline-offset-2">
            #{entry.invoice.invoiceNumber}/{entry.invoice.financialYear}
          </a>
          {" "}and cannot be edited.
        </div>
      )}

      <ProductionForm
        action={action}
        customers={customers}
        employees={employees}
        defaultValues={entry}
        isInvoiced={!!entry.invoiceId}
      />
    </div>
  )
}
