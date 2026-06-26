"use client"

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Download } from "lucide-react"
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
import { getOutstandingInvoices } from "@/lib/actions/invoices"

type OutstandingInvoice = Awaited<ReturnType<typeof getOutstandingInvoices>>[number]

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

interface OutstandingCustomer {
  customerId: string
  name: string
  totalBilled: number
  totalPaid: number
  balance: number
}

interface Props {
  invoices: Invoice[]
  customers: Customer[]
  from: string
  to: string
  selectedCustomerId: string
  selectedStatus: string
  outstandingByCustomer: OutstandingCustomer[]
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

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-IN")
}

export function InvoiceReport({
  invoices,
  customers,
  from,
  to,
  selectedCustomerId,
  selectedStatus,
  outstandingByCustomer,
}: Props) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetCustomerName, setSheetCustomerName] = useState("")
  const [sheetInvoices, setSheetInvoices] = useState<OutstandingInvoice[]>([])
  const [isPending, startTransition] = useTransition()

  function openCustomerOutstanding(customerId: string, name: string) {
    startTransition(async () => {
      const data = await getOutstandingInvoices(customerId)
      setSheetInvoices(data)
      setSheetCustomerName(name)
      setSheetOpen(true)
    })
  }

  function navigate(f: string, t: string, customer: string, status: string) {
    const params = new URLSearchParams()
    params.set("from", f)
    params.set("to", t)
    if (customer) params.set("customer", customer)
    if (status) params.set("status", status)
    router.push(`/admin/reports?${params.toString()}`)
  }

  function exportCsv() {
    const hasCgstSgst = invoices.some((i) => i.cgst > 0 || i.sgst > 0)
    const hasIgst = invoices.some((i) => i.igst > 0)

    const headers = [
      "Sl.", "Invoice No.", "Date", "Customer", "Qty", "Basic",
      ...(hasCgstSgst ? ["CGST", "SGST"] : []),
      ...(hasIgst ? ["IGST"] : []),
      "Total", "Status", "Received", "Balance",
    ]

    const rows = invoices.map((inv, i) => [
      i + 1,
      `${inv.invoiceNumber}/${inv.financialYear}`,
      format(new Date(inv.invoiceDate), "dd.MM.yyyy"),
      inv.customer.name,
      inv.qty,
      Math.round(inv.basicAmount),
      ...(hasCgstSgst ? [Math.round(inv.cgst), Math.round(inv.sgst)] : []),
      ...(hasIgst ? [Math.round(inv.igst)] : []),
      Math.round(inv.totalAmount),
      inv.status,
      Math.round(inv.paid),
      Math.round(inv.balance),
    ])

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoice-report-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalBasic = invoices.reduce((s, i) => s + i.basicAmount, 0)
  const totalCgst = invoices.reduce((s, i) => s + i.cgst, 0)
  const totalSgst = invoices.reduce((s, i) => s + i.sgst, 0)
  const totalIgst = invoices.reduce((s, i) => s + i.igst, 0)
  const totalAmount = invoices.reduce((s, i) => s + i.totalAmount, 0)
  const totalPaid = invoices.reduce((s, i) => s + i.paid, 0)
  const totalBalance = invoices.reduce((s, i) => s + i.balance, 0)

  const showCgstSgst = invoices.some((i) => i.cgst > 0 || i.sgst > 0)
  const showIgst = invoices.some((i) => i.igst > 0)

  const filteredOutstanding = selectedCustomerId
    ? outstandingByCustomer.filter((c) => c.customerId === selectedCustomerId)
    : outstandingByCustomer
  const totalOutstanding = filteredOutstanding.reduce((s, c) => s + c.balance, 0)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => navigate(e.target.value, to, selectedCustomerId, selectedStatus)}
              className="h-8 px-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => navigate(from, e.target.value, selectedCustomerId, selectedStatus)}
              className="h-8 px-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <Select
            value={selectedCustomerId || "all"}
            onValueChange={(v) => navigate(from, to, v === "all" ? "" : v, selectedStatus)}
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

          <Select
            value={selectedStatus || "all"}
            onValueChange={(v) => navigate(from, to, selectedCustomerId, v === "all" ? "" : v)}
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
            <div className="rounded-md border bg-white px-3 py-1.5 text-sm leading-none">
              <p className="text-xs text-muted-foreground mb-0.5">Total</p>
              <p className="font-semibold">₹{fmt(totalAmount)}</p>
            </div>
          )}
          {/* <Button variant="outline" size="sm" onClick={exportCsv} disabled={invoices.length === 0}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button> */}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        {invoices.length === 0 ? (
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
                {showIgst && <th className="px-3 py-3 font-medium text-muted-foreground">IGST</th>}
                <th className="px-3 py-3 font-medium text-muted-foreground">Total</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">Received</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv, i) => (
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
                <td className={`px-3 py-2.5 ${totalBalance > 0 ? "text-red-600" : ""}`}>{fmt(totalBalance)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Outstanding — All Time */}
      {filteredOutstanding.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm">Outstanding — All Time</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Click a customer to view their pending invoices</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Outstanding</p>
              <p className="font-semibold text-red-600">₹{fmt(totalOutstanding)}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Customer</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Total Billed</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Received</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOutstanding.map((c) => (
                  <tr
                    key={c.customerId}
                    className="hover:bg-red-50 cursor-pointer"
                    onClick={() => openCustomerOutstanding(c.customerId, c.name)}
                  >
                    <td className="px-4 py-2.5 font-medium">{c.name}</td>
                    <td className="px-4 py-2.5 text-right">{fmt(c.totalBilled)}</td>
                    <td className="px-4 py-2.5 text-right text-green-700">{fmt(c.totalPaid)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-red-600">₹{fmt(c.balance)}</td>
                  </tr>
                ))}
              </tbody>
              {filteredOutstanding.length > 1 && (
                <tfoot className="border-t bg-gray-50 font-semibold">
                  <tr>
                    <td className="px-4 py-2.5">Total</td>
                    <td className="px-4 py-2.5 text-right">{fmt(filteredOutstanding.reduce((s, c) => s + c.totalBilled, 0))}</td>
                    <td className="px-4 py-2.5 text-right text-green-700">{fmt(filteredOutstanding.reduce((s, c) => s + c.totalPaid, 0))}</td>
                    <td className="px-4 py-2.5 text-right text-red-600">₹{fmt(totalOutstanding)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Pending invoices sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Outstanding Invoices — {sheetCustomerName}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {isPending ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
            ) : sheetInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No outstanding invoices.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Invoice No.</th>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Date</th>
                      <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Total</th>
                      <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Received</th>
                      <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Balance</th>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sheetInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => { setSheetOpen(false); router.push(`/admin/invoices/${inv.id}`) }}
                      >
                        <td className="px-3 py-2.5 font-mono text-blue-600 font-medium">
                          {inv.invoiceNumber}/{inv.financialYear}
                        </td>
                        <td className="px-3 py-2.5">{format(new Date(inv.invoiceDate), "dd.MM.yyyy")}</td>
                        <td className="px-3 py-2.5 text-right">{fmt(inv.totalAmount)}</td>
                        <td className="px-3 py-2.5 text-right text-green-700">{inv.paid > 0 ? fmt(inv.paid) : "—"}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-red-600">{fmt(inv.balance)}</td>
                        <td className="px-3 py-2.5"><StatusChip status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t font-semibold">
                    <tr>
                      <td className="px-3 py-2.5" colSpan={2} />
                      <td className="px-3 py-2.5 text-right">{fmt(sheetInvoices.reduce((s, i) => s + i.totalAmount, 0))}</td>
                      <td className="px-3 py-2.5 text-right text-green-700">{fmt(sheetInvoices.reduce((s, i) => s + i.paid, 0))}</td>
                      <td className="px-3 py-2.5 text-right text-red-600">{fmt(sheetInvoices.reduce((s, i) => s + i.balance, 0))}</td>
                      <td className="px-3 py-2.5" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
