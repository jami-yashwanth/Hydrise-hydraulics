"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Unlink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { unlinkEntryFromDC } from "@/lib/actions/dcs"

interface Entry {
  id: string
  chromePlatingDate: Date
  customerDcNo: string | null
  rodDiaMm: number
  rodLengthMm: number
  quantity: number
  jobType: string | null
  description: string | null
  totalCost: number
  invoiceId: string | null
  invoice: { invoiceNumber: string; financialYear: string } | null
}

interface Props {
  dcId: string
  entries: Entry[]
  customer: { id: string; name: string; taxType: string }
}

export function DCEntriesTable({ dcId, entries }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [unlinkId, setUnlinkId] = useState<string | null>(null)
  const [unlinkError, setUnlinkError] = useState("")

  function handleUnlink() {
    if (!unlinkId) return
    setUnlinkError("")
    startTransition(async () => {
      try {
        await unlinkEntryFromDC(unlinkId, dcId)
        setUnlinkId(null)
        router.refresh()
      } catch (e) {
        setUnlinkError(e instanceof Error ? e.message : "Failed to unlink entry")
      }
    })
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Sl.</th>
            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Date</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Qty</th>
            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Cust. DC</th>
            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Dia (mm)</th>
            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Length (mm)</th>
            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Invoice</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {entries.map((e, i) => (
            <tr key={e.id} className={`hover:bg-gray-50 ${e.invoiceId ? "opacity-60" : ""}`}>
              <td className="px-4 py-2.5 text-center text-muted-foreground">{i + 1}</td>
              <td className="px-4 py-2.5 text-center">{format(new Date(e.chromePlatingDate), "dd.MM.yyyy")}</td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {[e.jobType, e.description].filter(Boolean).join(" — ") || "—"}
              </td>
              <td className="px-4 py-2.5 text-center font-medium">{e.quantity}</td>
              <td className="px-4 py-2.5 text-center text-muted-foreground">{e.customerDcNo ?? "—"}</td>
              <td className="px-4 py-2.5 text-center">{e.rodDiaMm}</td>
              <td className="px-4 py-2.5 text-center">{e.rodLengthMm}</td>
              <td className="px-4 py-2.5 text-center">
                {e.invoice ? (
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
              <td className="px-2 py-2.5 text-center">
                {!e.invoiceId && (
                  <button
                    type="button"
                    onClick={() => { setUnlinkError(""); setUnlinkId(e.id) }}
                    className="p-1 rounded text-muted-foreground hover:text-orange-600 hover:bg-orange-50 transition-colors"
                    title="Unlink from DC"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={!!unlinkId} onOpenChange={(open) => { if (!isPending && !open) setUnlinkId(null) }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Unlink Entry</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This entry will be removed from the DC and can be linked to another DC later.
          </p>
          {unlinkError && <p className="text-sm text-red-600">{unlinkError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlinkId(null)} disabled={isPending}>Cancel</Button>
            <Button variant="destructive" onClick={handleUnlink} disabled={isPending}>
              {isPending ? "Unlinking..." : "Unlink"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
