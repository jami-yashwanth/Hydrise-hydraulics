"use client"

import React, { useState, useTransition, useEffect } from "react"
import { format } from "date-fns"
import { Truck } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getPendingEntriesForCustomer, createDC, getNextDCNumber } from "@/lib/actions/dcs"

type PendingEntry = {
  id: string
  chromePlatingDate: Date
  customerDcNo: string | null
  rodDiaMm: number
  rodLengthMm: number
  area: number
  totalCost: number
  employee: { name: string } | null
}

interface Props {
  customerId: string
  customerName: string
}

export function CreateDCDialog({ customerId, customerName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<PendingEntry[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [dcDate, setDcDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [nextDcNumber, setNextDcNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  async function handleOpen() {
    setError("")
    setSelectedIds(new Set())
    setNextDcNumber(null)
    setLoading(true)
    setOpen(true)
    const today = format(new Date(), "yyyy-MM-dd")
    setDcDate(today)
    const [fetchedEntries, dcNum] = await Promise.all([
      getPendingEntriesForCustomer(customerId),
      getNextDCNumber(today),
    ])
    setEntries(fetchedEntries)
    setNextDcNumber(dcNum)
    setLoading(false)
  }

  useEffect(() => {
    if (!open) return
    setNextDcNumber(null)
    getNextDCNumber(dcDate).then(setNextDcNumber)
  }, [dcDate, open])

  const grouped = entries.reduce<Record<string, PendingEntry[]>>((acc, e) => {
    const key = format(new Date(e.chromePlatingDate), "MMMM yyyy")
    ;(acc[key] ??= []).push(e)
    return acc
  }, {})

  const allIds = entries.map((e) => e.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id))

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(allIds))
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const selectedEntries = entries.filter((e) => selectedIds.has(e.id))
  const totalCost = selectedEntries.reduce((sum, e) => sum + e.totalCost, 0)

  function handleCreate() {
    setError("")
    startTransition(async () => {
      try {
        await createDC({
          productionEntryIds: Array.from(selectedIds),
          customerId,
          dcDate,
        })
        setOpen(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create DC")
      }
    })
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleOpen}>
        <Truck className="h-4 w-4 mr-1.5" />
        Create DC
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!isPending && !loading) {
            setOpen(v)
            setError("")
          }
        }}
      >
        <DialogContent className="w-[90vw] !max-w-[90vw] flex flex-col !max-h-[90vh] h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create Delivery Challan — {customerName}</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-16 text-sm text-muted-foreground">
              Loading pending entries…
            </div>
          ) : entries.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-16 text-sm text-muted-foreground">
              No pending entries for this customer.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0 border rounded-lg">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 w-8 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded accent-gray-900"
                      />
                    </th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground align-middle">Date</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground align-middle">Customer DC</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground align-middle">Dia (mm)</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground align-middle">Length (mm)</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground align-middle">Area</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground align-middle">Total Cost</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground align-middle">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(grouped).map(([month, monthEntries]) => (
                    <React.Fragment key={month}>
                      <tr>
                        <td
                          colSpan={8}
                          className="px-3 py-1.5 bg-gray-100 text-xs font-semibold text-muted-foreground"
                        >
                          {month}
                        </td>
                      </tr>
                      {monthEntries.map((e) => (
                        <tr
                          key={e.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleOne(e.id)}
                        >
                          <td
                            className="px-3 py-2.5 text-center align-middle"
                            onClick={(ev) => ev.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.has(e.id)}
                              onChange={() => toggleOne(e.id)}
                              className="rounded accent-gray-900"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center align-middle">
                            {format(new Date(e.chromePlatingDate), "dd.MM.yyyy")}
                          </td>
                          <td className="px-3 py-2.5 text-center align-middle text-muted-foreground">
                            {e.customerDcNo ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 text-center align-middle">{e.rodDiaMm}</td>
                          <td className="px-3 py-2.5 text-center align-middle">{e.rodLengthMm}</td>
                          <td className="px-3 py-2.5 text-center align-middle">{e.area.toFixed(0)}</td>
                          <td className="px-3 py-2.5 text-center align-middle font-medium">
                            {e.totalCost > 0 ? Math.round(e.totalCost).toLocaleString("en-IN") : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-left align-middle text-muted-foreground">
                            {e.employee?.name ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {entries.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Selected: </span>
                  <span className="font-medium">{selectedIds.size} entries</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-medium">₹{Math.round(totalCost).toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">DC Number: </span>
                  <span className="font-medium text-blue-700">
                    {nextDcNumber ? `#${nextDcNumber}` : "…"}
                  </span>
                </div>
              </div>
              <div className="flex items-end gap-4">
                <div className="space-y-1.5">
                  <Label>DC Date</Label>
                  <Input
                    type="date"
                    value={dcDate}
                    onChange={(e) => setDcDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending || loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending || loading || selectedIds.size === 0}
            >
              {isPending ? "Creating…" : `Create DC (${selectedIds.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
