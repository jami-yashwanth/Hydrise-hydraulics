"use client"

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { useState, useTransition } from "react"
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
import { RecordPaymentDialog } from "@/components/admin/record-payment-dialog"
import { getOutstandingInvoices } from "@/lib/actions/invoices"

interface Invoice {
  id: string
  invoiceNumber: string
  financialYear: string
  invoiceDate: Date
  basicAmount: number
  cgst: number
  sgst: number
  igst: number
  totalAmount: number
  qty: number
  paid: number
  balance: number
  status: "UNPAID" | "PARTIAL" | "PAID"
  customer: { id: string; name: string }
}

interface Customer {
  id: string
  name: string
}

interface Props {
  invoices: Invoice[]
  customers: Customer[]
  currentMonth: string
  selectedCustomerId: string
  selectedStatus: string
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

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-IN")
}

type OutstandingInvoice = Awaited<ReturnType<typeof getOutstandingInvoices>>[number]

export function InvoiceRegister({ invoices, customers, currentMonth, selectedCustomerId, selectedStatus }: Props) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [outstandingAll, setOutstandingAll] = useState<OutstandingInvoice[]>([])
  const [isPending, startTransition] = useTransition()

  function openOutstanding() {
    startTransition(async () => {
      const data = await getOutstandingInvoices(selectedCustomerId || undefined)
      setOutstandingAll(data)
      setSheetOpen(true)
    })
  }

  function navigate(month: string, customer: string, status: string) {
    const params = new URLSearchParams()
    params.set("month", month)
    if (customer) params.set("customer", customer)
    if (status) params.set("status", status)
    router.push(`/admin/invoices?${params.toString()}`)
  }

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const filteredInvoices = selectedStatus
    ? invoices.filter((i) => i.status === selectedStatus)
    : invoices

  const outstandingInvoices = filteredInvoices
    .filter((i) => i.balance > 0)
    .map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      financialYear: i.financialYear,
      invoiceDate: i.invoiceDate,
      totalAmount: i.totalAmount,
      balance: i.balance,
    }))

  // Table/footer totals respect both customer + status filters
  const totalBasic = filteredInvoices.reduce((s, i) => s + i.basicAmount, 0)
  const totalCgst = filteredInvoices.reduce((s, i) => s + i.cgst, 0)
  const totalSgst = filteredInvoices.reduce((s, i) => s + i.sgst, 0)
  const totalIgst = filteredInvoices.reduce((s, i) => s + i.igst, 0)
  const totalAmount = filteredInvoices.reduce((s, i) => s + i.totalAmount, 0)
  const totalPaid = filteredInvoices.reduce((s, i) => s + i.paid, 0)
  const totalBalance = filteredInvoices.reduce((s, i) => s + i.balance, 0)

  // Outstanding badge always shows true outstanding regardless of status filter
  const outstandingBalance = invoices.reduce((s, i) => s + i.balance, 0)

  const showCgstSgst = filteredInvoices.some((i) => i.cgst > 0 || i.sgst > 0)
  const showIgst = filteredInvoices.some((i) => i.igst > 0)

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(prevMonth(currentMonth), selectedCustomerId, selectedStatus)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => navigate(e.target.value, selectedCustomerId, selectedStatus)}
              className="h-8 px-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(nextMonth(currentMonth), selectedCustomerId, selectedStatus)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Select
            value={selectedCustomerId || "all"}
            onValueChange={(v) => navigate(currentMonth, v === "all" ? "" : v, selectedStatus)}
          >
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue placeholder="All Customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedStatus || "all"}
            onValueChange={(v) => navigate(currentMonth, selectedCustomerId, v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="UNPAID">Unpaid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {invoices.length > 0 && (
            <>
              <div className="rounded-md border bg-white px-3 py-1.5 text-sm leading-none">
                <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                <p className="font-semibold">₹{fmt(totalAmount)}</p>
              </div>
              {outstandingBalance > 0 && (
                <button
                  onClick={openOutstanding}
                  disabled={isPending}
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm leading-none flex items-center gap-2 hover:bg-red-100 transition-colors disabled:opacity-60"
                >
                  <div>
                    <p className="text-xs text-red-400 mb-0.5 text-left">Outstanding</p>
                    <p className="font-semibold text-red-700">₹{fmt(outstandingBalance)}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-red-400 shrink-0" />
                </button>
              )}
            </>
          )}
          {selectedCustomer && outstandingInvoices.length > 0 && (
            <RecordPaymentDialog
              customerId={selectedCustomerId}
              customerName={selectedCustomer.name}
              outstandingInvoices={outstandingInvoices}
            />
          )}
        </div>
      </div>

      {/* Outstanding invoices sheet */}
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
                      <td className="px-3 py-2.5 text-right text-red-600">{fmt(outstandingAll.reduce((s, i) => s + i.balance, 0))}</td>
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
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No invoices for this period.
          </div>
        ) : (
          <table className="w-full text-sm whitespace-nowrap text-center">
            <thead className="bg-gray-50 border-b">
              <tr className="align-middle">
                <th className="px-3 py-3 font-medium text-muted-foreground">Sl.</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">Invoice No.</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">Date</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">Qty</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">Basic</th>
                {showCgstSgst && (
                  <>
                    <th className="px-3 py-3 font-medium text-muted-foreground">CGST</th>
                    <th className="px-3 py-3 font-medium text-muted-foreground">SGST</th>
                  </>
                )}
                {showIgst && (
                  <th className="px-3 py-3 font-medium text-muted-foreground">IGST</th>
                )}
                <th className="px-3 py-3 font-medium text-muted-foreground">Total</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">Received</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.map((inv, i) => (
                <tr
                  key={inv.id}
                  className="hover:bg-gray-50 cursor-pointer align-middle"
                  onClick={() => router.push(`/admin/invoices/${inv.id}`)}
                >
                  <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2.5 font-mono text-blue-600 font-medium">
                    {inv.invoiceNumber}/{inv.financialYear}
                  </td>
                  <td className="px-3 py-2.5">{format(new Date(inv.invoiceDate), "dd.MM.yyyy")}</td>
                  <td className="px-3 py-2.5 font-medium">{inv.customer.name}</td>
                  <td className="px-3 py-2.5 text-blue-600 font-medium">{inv.qty}</td>
                  <td className="px-3 py-2.5">{fmt(inv.basicAmount)}</td>
                  {showCgstSgst && (
                    <>
                      <td className="px-3 py-2.5 text-muted-foreground">{inv.cgst > 0 ? fmt(inv.cgst) : "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{inv.sgst > 0 ? fmt(inv.sgst) : "—"}</td>
                    </>
                  )}
                  {showIgst && (
                    <td className="px-3 py-2.5 text-muted-foreground">{inv.igst > 0 ? fmt(inv.igst) : "—"}</td>
                  )}
                  <td className="px-3 py-2.5 font-semibold">{fmt(inv.totalAmount)}</td>
                  <td className="px-3 py-2.5"><StatusChip status={inv.status} /></td>
                  <td className="px-3 py-2.5 text-green-700">{inv.paid > 0 ? fmt(inv.paid) : "—"}</td>
                  <td className={`px-3 py-2.5 font-medium ${inv.balance > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                    {inv.balance > 0 ? fmt(inv.balance) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Month totals */}
            <tfoot className="bg-gray-50 border-t font-semibold">
              <tr className="align-middle">
                <td className="px-3 py-2.5" colSpan={5} />
                <td className="px-3 py-2.5">{fmt(totalBasic)}</td>
                {showCgstSgst && (
                  <>
                    <td className="px-3 py-2.5">{fmt(totalCgst)}</td>
                    <td className="px-3 py-2.5">{fmt(totalSgst)}</td>
                  </>
                )}
                {showIgst && <td className="px-3 py-2.5">{fmt(totalIgst)}</td>}
                <td className="px-3 py-2.5">{fmt(totalAmount)}</td>
                <td className="px-3 py-2.5" />
                <td className="px-3 py-2.5 text-green-700">{fmt(totalPaid)}</td>
                <td className={`px-3 py-2.5 ${totalBalance > 0 ? "text-red-600" : ""}`}>
                  {fmt(totalBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
