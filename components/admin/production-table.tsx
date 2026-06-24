"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { format } from "date-fns"
import { CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight, Truck, Trash2 } from "lucide-react"
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
import { createDC, getNextDCNumber } from "@/lib/actions/dcs"
import { deleteProductionEntry } from "@/lib/actions/production"
import { fyMonths } from "@/lib/fy"

interface Entry {
  id: string
  slNo: number
  chromePlatingDate: Date
  customerDcNo: string | null
  rodDiaMm: number
  rodLengthMm: number
  area: number
  totalCost: number
  status: "PENDING" | "SUCCESS" | "FAILED"
  customer: { id: string; name: string }
  employee: { name: string } | null
  redoOfId: string | null
  dcId: string | null
  dc: { dcNumber: string; financialYear: string } | null
  invoiceId: string | null
  invoice: { invoiceNumber: string; financialYear: string } | null
}

interface Customer {
  id: string
  name: string
  taxType: string
}

interface Props {
  entries: Entry[]
  customers: Customer[]
  currentMonth: string
  selectedCustomerId: string
  currentFY: string
}

function StatusBadge({ status, isRedo }: { status: string; isRedo: boolean }) {
  if (status === "SUCCESS")
    return (
      <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {isRedo ? "Success (Redo)" : "Success"}
      </span>
    )
  if (status === "FAILED")
    return (
      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
        <XCircle className="h-3.5 w-3.5" />
        Failed
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-yellow-600 text-xs font-medium">
      <Clock className="h-3.5 w-3.5" />
      Pending
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

type SelectionMode = "none" | "create-dc"

function getSelectionMode(selectedIds: Set<string>): SelectionMode {
  if (selectedIds.size === 0) return "none"
  return "create-dc"
}

export function ProductionTable({ entries, customers, currentMonth, selectedCustomerId, currentFY }: Props) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDcDialog, setShowDcDialog] = useState(false)
  const [dcDate, setDcDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [nextDcNumber, setNextDcNumber] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState("")

  function handleDelete() {
    if (!deleteEntryId) return
    setDeleteError("")
    startTransition(async () => {
      try {
        await deleteProductionEntry(deleteEntryId)
        setDeleteEntryId(null)
        router.refresh()
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : "Failed to delete entry")
      }
    })
  }

  const showCheckboxes = !!selectedCustomerId
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)

  // Selectable = SUCCESS + no DC yet + not invoiced
  const selectableIds = entries
    .filter((e) => e.status === "SUCCESS" && !e.dcId && !e.invoiceId)
    .map((e) => e.id)

  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))
  const selectionMode = getSelectionMode(selectedIds)

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(selectableIds))
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  function navigate(month: string, customer: string) {
    setSelectedIds(new Set())
    const params = new URLSearchParams()
    params.set("month", month)
    if (customer) params.set("customer", customer)
    router.push(`/admin/production?${params.toString()}`)
  }

  const fyMonthList = fyMonths(currentFY)
  const isFirstMonth = fyMonthList[0] === currentMonth
  const isLastMonth = fyMonthList[fyMonthList.length - 1] === currentMonth

  function handleCreateDC() {
    setError("")
    startTransition(async () => {
      try {
        await createDC({
          productionEntryIds: Array.from(selectedIds),
          customerId: selectedCustomerId,
          dcDate,
        })
        setSelectedIds(new Set())
        setShowDcDialog(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create DC")
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
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
        </div>

        <div className="flex items-center gap-3">
          {entries.length > 0 && (
            <div className="text-sm text-right">
              <span className="text-muted-foreground">
                {selectedCustomerId ? entries[0]?.customer.name : "All Customers"}
              </span>
              <span className="ml-2 font-semibold">
                ₹{Math.round(entries.reduce((sum, e) => sum + e.totalCost, 0)).toLocaleString("en-IN")}
              </span>
            </div>
          )}
          {selectionMode === "create-dc" && (
            <Button size="sm" variant="outline" onClick={async () => { setError(""); setNextDcNumber(null); setShowDcDialog(true); setNextDcNumber(await getNextDCNumber(dcDate)) }}>
              <Truck className="h-4 w-4 mr-1.5" />
              Create DC ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No production entries for this period.
          </div>
        ) : (
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                {showCheckboxes && (
                  <th className="px-3 py-3 w-8 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={selectableIds.length === 0}
                      className="rounded accent-gray-900"
                    />
                  </th>
                )}
                <th className="text-center px-3 py-3 font-medium text-muted-foreground align-middle">Sl.</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground align-middle">Date</th>
                {!showCheckboxes && <th className="text-left px-3 py-3 font-medium text-muted-foreground align-middle">Customer</th>}
                <th className="text-center px-3 py-3 font-medium text-muted-foreground align-middle">Customer DC</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground align-middle">Hydrise DC</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground align-middle">Dia (mm)</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground align-middle">Length (mm)</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground align-middle">Area</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground align-middle">Total Cost</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground align-middle">Status</th>
                <th className="text-left px-3 py-3 font-medium text-muted-foreground align-middle">Operator</th>
                {showCheckboxes && <th className="text-center px-3 py-3 font-medium text-muted-foreground align-middle">Invoice</th>}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((e) => {
                const isInvoiced = !!e.invoiceId
                const isSelectable = showCheckboxes && e.status === "SUCCESS" && !isInvoiced
                const isChecked = selectedIds.has(e.id)

                return (
                  <tr
                    key={e.id}
                    className={`hover:bg-gray-50 cursor-pointer ${e.status === "FAILED" ? "bg-red-50/40" : ""} ${isInvoiced ? "opacity-60" : ""}`}
                    onClick={() => router.push(`/admin/production/${e.id}`)}
                  >
                    {showCheckboxes && (
                      <td className="px-3 py-2.5 text-center align-middle" onClick={(ev) => ev.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!isSelectable}
                          onChange={() => isSelectable && toggleOne(e.id)}
                          className="rounded accent-gray-900"
                        />
                      </td>
                    )}
                    <td className="px-3 py-2.5 text-center align-middle text-muted-foreground">{e.slNo}</td>
                    <td className="px-3 py-2.5 text-center align-middle">{format(new Date(e.chromePlatingDate), "dd.MM.yyyy")}</td>
                    {!showCheckboxes && <td className="px-3 py-2.5 text-left align-middle font-medium">{e.customer.name}</td>}
                    <td className="px-3 py-2.5 text-center align-middle text-muted-foreground">{e.customerDcNo ?? "—"}</td>
                    <td className="px-3 py-2.5 text-center align-middle">
                      {e.dc ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          #{e.dc.dcNumber}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center align-middle">{e.rodDiaMm}</td>
                    <td className="px-3 py-2.5 text-center align-middle">{e.rodLengthMm}</td>
                    <td className="px-3 py-2.5 text-center align-middle">{e.area.toFixed(0)}</td>
                    <td className="px-3 py-2.5 text-center align-middle font-medium">
                      {e.totalCost > 0 ? Math.round(e.totalCost).toLocaleString("en-IN") : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center align-middle">
                      <StatusBadge status={e.status} isRedo={!!e.redoOfId} />
                    </td>
                    <td className="px-3 py-2.5 text-left align-middle text-muted-foreground">{e.employee?.name ?? "—"}</td>
                    {showCheckboxes && (
                      <td className="px-3 py-2.5 text-center align-middle" onClick={(ev) => ev.stopPropagation()}>
                        {isInvoiced && e.invoice ? (
                          <Link
                            href={`/admin/invoices/${e.invoiceId}`}
                            className="text-xs text-blue-600 hover:underline font-mono"
                          >
                            #{e.invoice.invoiceNumber}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-2 py-2.5 text-center align-middle" onClick={(ev) => ev.stopPropagation()}>
                      {!isInvoiced && (
                        <button
                          type="button"
                          onClick={() => { setDeleteError(""); setDeleteEntryId(e.id) }}
                          className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create DC Dialog */}
      <Dialog open={showDcDialog} onOpenChange={(open) => { if (!isPending) { setShowDcDialog(open); setError("") } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Delivery Challan</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{selectedCustomer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entries</span>
                <span className="font-medium">{selectedIds.size} Nos.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DC Number</span>
                <span className="font-medium text-blue-700">
                  {nextDcNumber ? `#${nextDcNumber}` : "Loading..."}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>DC Date</Label>
              <Input
                type="date"
                value={dcDate}
                onChange={(e) => setDcDate(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDcDialog(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleCreateDC} disabled={isPending}>
              {isPending ? "Creating..." : "Create DC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteEntryId} onOpenChange={(open) => { if (!isPending && !open) setDeleteEntryId(null) }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the production entry. This action cannot be undone.</p>
          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteEntryId(null)} disabled={isPending}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
