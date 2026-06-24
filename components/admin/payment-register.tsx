"use client"

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { useState, useTransition } from "react"
import { fyMonths } from "@/lib/fy"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { getOutstandingInvoices } from "@/lib/actions/invoices"

interface Payment {
  id: string
  amount: number
  paymentDate: Date
  reference: string | null
  notes: string | null
  customer: { id: string; name: string }
  allocations: {
    amount: number
    invoice: { invoiceNumber: string; financialYear: string }
  }[]
}

interface Customer {
  id: string
  name: string
}

interface Props {
  payments: Payment[]
  customers: Customer[]
  currentMonth: string
  selectedCustomerId: string
  currentFY: string
  initialOutstandingTotal: number
}

type OutstandingInvoice = Awaited<ReturnType<typeof getOutstandingInvoices>>[number]

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-IN")
}

function StatusChip({ status }: { status: "UNPAID" | "PARTIAL" | "PAID" }) {
  const cls =
    status === "PAID"
      ? "bg-green-100 text-green-800"
      : status === "PARTIAL"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-700"
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}

function prevMonth(m: string) {
  const [y, mo] = m.split("-").map(Number)
  const d = new Date(y, mo - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function nextMonth(m: string) {
  const [y, mo] = m.split("-").map(Number)
  const d = new Date(y, mo, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function PaymentRegister({ payments, customers, currentMonth, selectedCustomerId, currentFY, initialOutstandingTotal }: Props) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [outstandingAll, setOutstandingAll] = useState<OutstandingInvoice[]>([])
  const [isPending, startTransition] = useTransition()

  const fyMonthList = fyMonths(currentFY)
  const isFirstMonth = fyMonthList[0] === currentMonth
  const isLastMonth = fyMonthList[fyMonthList.length - 1] === currentMonth

  function navigate(month: string, customer: string) {
    const params = new URLSearchParams()
    params.set("month", month)
    if (customer) params.set("customer", customer)
    router.push(`/admin/payments?${params.toString()}`)
  }

  function openOutstanding() {
    startTransition(async () => {
      const data = await getOutstandingInvoices(selectedCustomerId || undefined)
      setOutstandingAll(data)
      setSheetOpen(true)
    })
  }

  const filtered = selectedCustomerId
    ? payments.filter((p) => p.customer.id === selectedCustomerId)
    : payments

  const totalAmount = filtered.reduce((s, p) => s + p.amount, 0)

  const outstandingTotal = outstandingAll.reduce((s, i) => s + i.balance, 0)

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={isFirstMonth}
              onClick={() => navigate(prevMonth(currentMonth), selectedCustomerId)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <input
              type="month"
              value={currentMonth}
              min={fyMonthList[0]}
              max={fyMonthList[fyMonthList.length - 1]}
              onChange={(e) => navigate(e.target.value, selectedCustomerId)}
              className="h-8 px-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={isLastMonth}
              onClick={() => navigate(nextMonth(currentMonth), selectedCustomerId)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Select
            value={selectedCustomerId || "all"}
            onValueChange={(v) => navigate(currentMonth, v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-8 w-auto min-w-[11rem] text-sm">
              <SelectValue placeholder="All Customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <div className="rounded-md border bg-white px-3 py-1.5 text-sm leading-none">
              <p className="text-xs text-muted-foreground mb-0.5">Total Received</p>
              <p className="font-semibold text-green-700">₹{fmt(totalAmount)}</p>
            </div>
          )}
          <button
            onClick={openOutstanding}
            disabled={isPending}
            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm leading-none flex items-center gap-2 hover:bg-red-100 transition-colors disabled:opacity-60"
          >
            <div>
              <p className="text-xs text-red-400 mb-0.5 text-left">Outstanding</p>
              <p className="font-semibold text-red-700">{isPending ? "…" : `₹${fmt(outstandingAll.length ? outstandingTotal : initialOutstandingTotal)}`}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-red-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* Outstanding sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedCustomerId
                ? `Outstanding Invoices — ${customers.find((c) => c.id === selectedCustomerId)?.name}`
                : "All Outstanding Invoices"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {outstandingAll.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No outstanding invoices.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Invoice No.</th>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Date</th>
                      {!selectedCustomerId && (
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Customer</th>
                      )}
                      <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Total</th>
                      <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Received</th>
                      <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Balance</th>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {outstandingAll.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => { setSheetOpen(false); router.push(`/admin/invoices/${inv.id}`) }}
                      >
                        <td className="px-3 py-2.5 font-mono text-blue-600 font-medium">
                          {inv.invoiceNumber}/{inv.financialYear}
                        </td>
                        <td className="px-3 py-2.5">{format(new Date(inv.invoiceDate), "dd.MM.yyyy")}</td>
                        {!selectedCustomerId && (
                          <td className="px-3 py-2.5 font-medium">{inv.customer.name}</td>
                        )}
                        <td className="px-3 py-2.5 text-right">{fmt(inv.totalAmount)}</td>
                        <td className="px-3 py-2.5 text-right text-green-700">{inv.paid > 0 ? fmt(inv.paid) : "—"}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-red-600">{fmt(inv.balance)}</td>
                        <td className="px-3 py-2.5"><StatusChip status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t font-semibold">
                    <tr>
                      <td className="px-3 py-2.5" colSpan={!selectedCustomerId ? 3 : 2} />
                      <td className="px-3 py-2.5 text-right">{fmt(outstandingAll.reduce((s, i) => s + i.totalAmount, 0))}</td>
                      <td className="px-3 py-2.5 text-right text-green-700">{fmt(outstandingAll.reduce((s, i) => s + i.paid, 0))}</td>
                      <td className="px-3 py-2.5 text-right text-red-600">{fmt(outstandingTotal)}</td>
                      <td className="px-3 py-2.5" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No payments recorded for this period.
          </div>
        ) : (
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-3 font-medium text-muted-foreground">Sl.</th>
                <th className="text-left px-3 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-3 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-3 py-3 font-medium text-muted-foreground">Reference</th>
                <th className="text-left px-3 py-3 font-medium text-muted-foreground">Invoices</th>
                <th className="text-right px-3 py-3 font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/admin/payments/${p.id}`)}
                >
                  <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2.5">{format(new Date(p.paymentDate), "dd.MM.yyyy")}</td>
                  <td className="px-3 py-2.5 font-medium">{p.customer.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{p.reference ?? "—"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">
                    {p.allocations.map((a) => `#${a.invoice.invoiceNumber}/${a.invoice.financialYear}`).join(", ")}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-green-700">
                    ₹{fmt(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t font-semibold">
              <tr>
                <td className="px-3 py-2.5" colSpan={5} />
                <td className="px-3 py-2.5 text-right text-green-700">₹{fmt(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
