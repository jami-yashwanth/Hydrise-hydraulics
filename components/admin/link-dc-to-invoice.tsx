"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { linkInvoicedEntriesToDC } from "@/lib/actions/dcs"

interface LineItem {
  id: string
}

interface CustomerDC {
  id: string
  dcNumber: string
  financialYear: string
  dcDate: Date
  _count: { entries: number }
}

interface Props {
  unlinkedEntries: LineItem[]
  customerDCs: CustomerDC[]
}

export function LinkDCToInvoice({ unlinkedEntries, customerDCs }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedDcId, setSelectedDcId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleLink() {
    if (!selectedDcId) return
    setError("")
    startTransition(async () => {
      try {
        await linkInvoicedEntriesToDC(selectedDcId, unlinkedEntries.map((e) => e.id))
        setOpen(false)
        setSelectedDcId(null)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to link entries to DC")
      }
    })
  }

  function handleOpen() {
    setError("")
    setSelectedDcId(null)
    setOpen(true)
  }

  if (customerDCs.length === 0) return null

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleOpen}>
        <PlusCircle className="h-4 w-4 mr-1.5" />
        Add DC
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!isPending) setOpen(v) }}>
        <DialogContent className="sm:max-w-[95vw] w-full max-w-3xl">
          <DialogHeader>
            <DialogTitle>Link Entries to Delivery Challan</DialogTitle>
          </DialogHeader>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 w-8 text-center" />
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">DC No.</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">FY</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Date</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {customerDCs.map((dc) => {
                    const selected = selectedDcId === dc.id
                    return (
                      <tr
                        key={dc.id}
                        className={`cursor-pointer transition-colors ${selected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                        onClick={() => setSelectedDcId(dc.id)}
                      >
                        <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="radio"
                            name="dc-select"
                            checked={selected}
                            onChange={() => setSelectedDcId(dc.id)}
                            className="accent-gray-900"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-semibold text-blue-700">
                          #{dc.dcNumber}
                        </td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">
                          {dc.financialYear}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {format(new Date(dc.dcDate), "dd MMM yyyy")}
                        </td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">
                          {dc._count.entries} Nos.
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {unlinkedEntries.length === 0 && (
            <p className="text-sm text-muted-foreground bg-gray-50 border rounded px-3 py-2">
              All entries on this invoice are already linked to a DC. Unlink an entry first to reassign it.
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleLink} disabled={isPending || !selectedDcId || unlinkedEntries.length === 0}>
              {isPending ? "Linking…" : "Link to DC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
