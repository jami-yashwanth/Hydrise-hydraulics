"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { PlusCircle, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { linkEntriesToDC } from "@/lib/actions/dcs"

interface Entry {
  id: string
  chromePlatingDate: Date
  customerDcNo: string | null
  rodDiaMm: number
  rodLengthMm: number
  area: number
  totalCost: number
  description: string | null
  jobType: string | null
  quantity: number
  status: "PENDING" | "SUCCESS" | "FAILED"
  employee: { name: string } | null
}

interface Props {
  dcId: string
  eligibleEntries: Entry[]
}

export function LinkEntriesToDC({ dcId, eligibleEntries }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const allSelected = eligibleEntries.length > 0 && selected.size === eligibleEntries.length

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(eligibleEntries.map((e) => e.id)))
  }

  function handleLink() {
    setError("")
    startTransition(async () => {
      try {
        await linkEntriesToDC(dcId, Array.from(selected))
        setSelected(new Set())
        setOpen(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to link entries")
      }
    })
  }

  if (eligibleEntries.length === 0) return null

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => { setSelected(new Set()); setError(""); setOpen(true) }}>
        <PlusCircle className="h-4 w-4 mr-1.5" />
        Add Entries
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!isPending) setOpen(v) }}>
        <DialogContent className="sm:max-w-[95vw] w-full">
          <DialogHeader>
            <DialogTitle>Link Entries to DC</DialogTitle>
          </DialogHeader>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded accent-gray-900"
                      />
                    </th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Sl.</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Date</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Cust. DC</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Qty</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Dia (mm)</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Length (mm)</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Area</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Total Cost</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Status</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {eligibleEntries.map((e, i) => {
                    const checked = selected.has(e.id)
                    return (
                      <tr
                        key={e.id}
                        className={`cursor-pointer hover:bg-blue-50/40 transition-colors ${checked ? "bg-blue-50" : ""}`}
                        onClick={() => toggle(e.id)}
                      >
                        <td className="px-3 py-2.5 text-center" onClick={(ev) => ev.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(e.id)}
                            className="rounded accent-gray-900"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-2.5 text-center">{format(new Date(e.chromePlatingDate), "dd.MM.yyyy")}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{e.customerDcNo ?? "—"}</td>
                        <td className="px-3 py-2.5 text-left text-muted-foreground max-w-[200px] truncate">
                          {[e.jobType, e.description].filter(Boolean).join(" — ") || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center">{e.quantity}</td>
                        <td className="px-3 py-2.5 text-center">{e.rodDiaMm}</td>
                        <td className="px-3 py-2.5 text-center">{e.rodLengthMm}</td>
                        <td className="px-3 py-2.5 text-center">{e.area.toFixed(0)}</td>
                        <td className="px-3 py-2.5 text-center font-medium">
                          {e.totalCost > 0 ? Math.round(e.totalCost).toLocaleString("en-IN") : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {e.status === "SUCCESS" ? (
                            <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-yellow-600 text-xs font-medium">
                              <Clock className="h-3.5 w-3.5" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{e.employee?.name ?? "—"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter className="items-center">
            <span className="text-xs text-muted-foreground mr-auto">
              {selected.size} of {eligibleEntries.length} selected
            </span>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleLink} disabled={isPending || selected.size === 0}>
              {isPending ? "Linking..." : `Link ${selected.size > 0 ? `${selected.size} ` : ""}Entries`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
