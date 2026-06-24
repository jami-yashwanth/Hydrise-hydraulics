"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Unlink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { unlinkEntryFromDCForInvoice } from "@/lib/actions/dcs"

interface LineItem {
  id: string
  chromePlatingDate: Date
  customerDcNo: string | null
  rodDiaMm: number
  rodLengthMm: number
  quantity: number
  totalCost: number
  dcId: string | null
  dc: { dcNumber: string; financialYear: string } | null
}

interface Props {
  lineItems: LineItem[]
}

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-IN")
}

export function InvoiceLineItems({ lineItems }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [unlinkEntryId, setUnlinkEntryId] = useState<string | null>(null)
  const [unlinkDcId, setUnlinkDcId] = useState<string | null>(null)
  const [unlinkError, setUnlinkError] = useState("")

  function handleUnlink() {
    if (!unlinkEntryId || !unlinkDcId) return
    setUnlinkError("")
    startTransition(async () => {
      try {
        await unlinkEntryFromDCForInvoice(unlinkEntryId, unlinkDcId)
        setUnlinkEntryId(null)
        setUnlinkDcId(null)
        router.refresh()
      } catch (e) {
        setUnlinkError(e instanceof Error ? e.message : "Failed to unlink entry from DC")
      }
    })
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Date</th>
            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Customer DC</th>
            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Hydrise DC</th>
            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Qty</th>
            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Dia (mm)</th>
            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Length (mm)</th>
            <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Amount</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {lineItems.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-2.5 text-center">{format(new Date(item.chromePlatingDate), "dd.MM.yyyy")}</td>
              <td className="px-4 py-2.5 text-center text-muted-foreground">{item.customerDcNo ?? "—"}</td>
              <td className="px-4 py-2.5 text-center">
                {item.dc ? (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    #{item.dc.dcNumber}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-center font-medium">{item.quantity}</td>
              <td className="px-4 py-2.5 text-center">{item.rodDiaMm}</td>
              <td className="px-4 py-2.5 text-center">{item.rodLengthMm}</td>
              <td className="px-4 py-2.5 text-right font-medium">₹{fmt(item.totalCost)}</td>
              <td className="px-2 py-2.5 text-center">
                {item.dcId && (
                  <button
                    type="button"
                    title="Unlink from DC"
                    onClick={() => {
                      setUnlinkError("")
                      setUnlinkEntryId(item.id)
                      setUnlinkDcId(item.dcId)
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Unlink Confirmation Dialog */}
      <Dialog
        open={!!unlinkEntryId}
        onOpenChange={(open) => {
          if (!isPending && !open) { setUnlinkEntryId(null); setUnlinkDcId(null) }
        }}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Unlink from DC</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This entry will be removed from its DC. It will remain on this invoice.
          </p>
          {unlinkError && <p className="text-sm text-red-600">{unlinkError}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setUnlinkEntryId(null); setUnlinkDcId(null) }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnlink} disabled={isPending}>
              {isPending ? "Unlinking…" : "Unlink"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
