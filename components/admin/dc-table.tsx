"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { format } from "date-fns"
import { Trash2, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { deleteDC } from "@/lib/actions/dcs"
import { getEntriesForDCs } from "@/lib/actions/dcs"
import { createInvoice } from "@/lib/actions/invoices"
import { GST_CONFIG } from "@/lib/config"
import { fyMonths } from "@/lib/fy"

interface DC {
  id: string
  dcNumber: string
  financialYear: string
  dcDate: Date
  customer: { id: string; name: string; taxType: string }
  entryCount: number
  hasInvoicedEntries: boolean
}

interface Props {
  dcs: DC[]
  customers: { id: string; name: string }[]
  selectedCustomerId: string
  currentMonth: string
  currentFY: string
}

type DialogPhase = "closed" | "loading" | "ready" | "creating"

interface InvoiceDialogData {
  entries: { id: string; totalCost: number }[]
  customer: { id: string; name: string; taxType: string }
}

function calcTax(basic: number, taxType: string, cgstPct: number, sgstPct: number, igstPct: number) {
  if (taxType === "INTRASTATE") {
    const cgst = parseFloat((basic * cgstPct / 100).toFixed(2))
    const sgst = parseFloat((basic * sgstPct / 100).toFixed(2))
    return { cgst, sgst, igst: 0, total: parseFloat((basic + cgst + sgst).toFixed(2)) }
  }
  if (taxType === "INTERSTATE") {
    const igst = parseFloat((basic * igstPct / 100).toFixed(2))
    return { cgst: 0, sgst: 0, igst, total: parseFloat((basic + igst).toFixed(2)) }
  }
  return { cgst: 0, sgst: 0, igst: 0, total: basic }
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

export function DCTable({ dcs, customers, selectedCustomerId, currentMonth, currentFY }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState("")

  // DC selection — only DCs with no invoiced entries are selectable
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectableDcIds = dcs.filter((dc) => !dc.hasInvoicedEntries).map((dc) => dc.id)
  const allSelected = selectableDcIds.length > 0 && selectableDcIds.every((id) => selectedIds.has(id))

  // Invoice dialog
  const [dialogPhase, setDialogPhase] = useState<DialogPhase>("closed")
  const [dialogData, setDialogData] = useState<InvoiceDialogData | null>(null)
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [cgstPct, setCgstPct] = useState(GST_CONFIG.cgstPercent)
  const [sgstPct, setSgstPct] = useState(GST_CONFIG.sgstPercent)
  const [igstPct, setIgstPct] = useState(GST_CONFIG.igstPercent)
  const [invoiceError, setInvoiceError] = useState("")
  const [selectionError, setSelectionError] = useState("")

  const fyMonthList = fyMonths(currentFY)
  const isFirstMonth = fyMonthList[0] === currentMonth
  const isLastMonth = fyMonthList[fyMonthList.length - 1] === currentMonth

  function navigate(month: string, customer: string) {
    const params = new URLSearchParams()
    params.set("month", month)
    if (customer) params.set("customer", customer)
    router.push(`/admin/dcs?${params.toString()}`)
    setSelectedIds(new Set())
  }

  function toggleAll() {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(selectableDcIds))
    setSelectionError("")
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
    setSelectionError("")
  }

  async function handleOpenInvoiceDialog() {
    const selected = dcs.filter((dc) => selectedIds.has(dc.id))
    const customerIds = new Set(selected.map((dc) => dc.customer.id))
    if (customerIds.size > 1) {
      setSelectionError("All selected DCs must belong to the same customer")
      return
    }
    setSelectionError("")
    setInvoiceError("")
    setDialogPhase("loading")
    try {
      const data = await getEntriesForDCs(Array.from(selectedIds))
      if (!data.customer) {
        setDialogPhase("closed")
        return
      }
      setDialogData({ entries: data.entries, customer: data.customer })
      setDialogPhase("ready")
    } catch {
      setDialogPhase("closed")
      setSelectionError("Failed to load entries")
    }
  }

  function handleCreateInvoice() {
    if (!dialogData) return
    setInvoiceError("")
    setDialogPhase("creating")
    startTransition(async () => {
      try {
        await createInvoice({
          productionEntryIds: dialogData.entries.map((e) => e.id),
          invoiceDate,
          customerId: dialogData.customer.id,
          cgstPercent: cgstPct,
          sgstPercent: sgstPct,
          igstPercent: igstPct,
        })
        setSelectedIds(new Set())
        setDialogPhase("closed")
        setDialogData(null)
        router.refresh()
      } catch (e) {
        setInvoiceError(e instanceof Error ? e.message : "Failed to create invoice")
        setDialogPhase("ready")
      }
    })
  }

  function handleDelete() {
    if (!deleteId) return
    setDeleteError("")
    startTransition(async () => {
      try {
        await deleteDC(deleteId)
        setDeleteId(null)
        router.refresh()
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : "Failed to delete DC")
      }
    })
  }

  const basicTotal = dialogData?.entries.reduce((s, e) => s + e.totalCost, 0) ?? 0
  const tax = dialogData
    ? calcTax(basicTotal, dialogData.customer.taxType, cgstPct, sgstPct, igstPct)
    : { cgst: 0, sgst: 0, igst: 0, total: 0 }

  const isDialogOpen = dialogPhase !== "closed"
  const isDialogBusy = dialogPhase === "loading" || dialogPhase === "creating"

  return (
    <div className="space-y-0">
      {/* Controls */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={isFirstMonth} onClick={() => navigate(prevMonth(currentMonth), selectedCustomerId)}>
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
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={isLastMonth} onClick={() => navigate(nextMonth(currentMonth), selectedCustomerId)}>
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

      {/* Selection toolbar */}
      {selectedIds.size > 0 && (
        <div className="px-4 py-2.5 border-b flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{selectedIds.size} DC{selectedIds.size > 1 ? "s" : ""} selected</span>
            {selectionError && <span className="text-sm text-red-600">{selectionError}</span>}
          </div>
          <Button size="sm" onClick={handleOpenInvoiceDialog}>
            <FileText className="h-4 w-4 mr-1.5" />
            Create Invoice
          </Button>
        </div>
      )}

      {/* Table */}
      {dcs.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No delivery challans for this period.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {selectedCustomerId && (
                <th className="px-3 py-3 w-8 text-center align-middle">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    disabled={selectableDcIds.length === 0}
                    onChange={toggleAll}
                    className="rounded accent-gray-900 disabled:cursor-not-allowed"
                  />
                </th>
              )}
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">DC No.</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">FY</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Items</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {dcs.map((dc) => (
              <tr key={dc.id} className={`hover:bg-gray-50 ${dc.hasInvoicedEntries ? "opacity-50" : ""}`}>
                {selectedCustomerId && (
                  <td className="px-3 py-3 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(dc.id)}
                      disabled={dc.hasInvoicedEntries}
                      onChange={() => !dc.hasInvoicedEntries && toggleOne(dc.id)}
                      className="rounded accent-gray-900 disabled:cursor-not-allowed"
                    />
                  </td>
                )}
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
                <td className="px-4 py-3 text-center text-muted-foreground">{dc.entryCount} Nos.</td>
                <td className="px-2 py-3 text-center">
                  {!dc.hasInvoicedEntries && (
                    <button
                      type="button"
                      onClick={() => { setDeleteError(""); setDeleteId(dc.id) }}
                      className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!isPending && !open) setDeleteId(null) }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete DC</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The DC will be deleted and its entries will be unlinked. This cannot be undone.
          </p>
          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isPending}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!isDialogBusy && !open) { setDialogPhase("closed"); setDialogData(null); setInvoiceError("") } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>

          {dialogPhase === "loading" ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading entries...</div>
          ) : dialogData && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{dialogData.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DCs Selected</span>
                  <span className="font-medium">{selectedIds.size} Nos.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entries</span>
                  <span className="font-medium">{dialogData.entries.length} Nos.</span>
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Basic Amount</span>
                  <span>₹{Math.round(basicTotal).toLocaleString("en-IN")}</span>
                </div>
                {dialogData.customer.taxType === "INTRASTATE" && (
                  <>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>CGST</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={cgstPct}
                          onChange={(e) => setCgstPct(parseFloat(e.target.value) || 0)}
                          className="w-14 h-6 text-xs border border-input rounded px-1.5 bg-white text-center"
                        />
                        <span>%</span>
                      </div>
                      <span>₹{Math.round(tax.cgst).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>SGST</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={sgstPct}
                          onChange={(e) => setSgstPct(parseFloat(e.target.value) || 0)}
                          className="w-14 h-6 text-xs border border-input rounded px-1.5 bg-white text-center"
                        />
                        <span>%</span>
                      </div>
                      <span>₹{Math.round(tax.sgst).toLocaleString("en-IN")}</span>
                    </div>
                  </>
                )}
                {dialogData.customer.taxType === "INTERSTATE" && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span>IGST</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={igstPct}
                        onChange={(e) => setIgstPct(parseFloat(e.target.value) || 0)}
                        className="w-14 h-6 text-xs border border-input rounded px-1.5 bg-white text-center"
                      />
                      <span>%</span>
                    </div>
                    <span>₹{Math.round(tax.igst).toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Total</span>
                  <span>₹{Math.round(tax.total).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>

              {dialogData.entries.length === 0 && (
                <p className="text-sm text-amber-600">No uninvoiced entries found in the selected DCs.</p>
              )}

              {invoiceError && <p className="text-sm text-red-600">{invoiceError}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogPhase("closed"); setDialogData(null); setInvoiceError("") }} disabled={isDialogBusy}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateInvoice}
              disabled={isDialogBusy || !dialogData || dialogData.entries.length === 0}
            >
              {dialogPhase === "creating" ? "Creating..." : "Generate Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
