"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { deleteInvoice } from "@/lib/actions/invoices"

interface Props {
  invoiceId: string
  invoiceLabel: string
  hasPayments: boolean
}

export function DeleteInvoiceButton({ invoiceId, invoiceLabel, hasPayments }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError("")
    startTransition(async () => {
      try {
        await deleteInvoice(invoiceId)
        router.push("/admin/invoices")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete invoice")
      }
    })
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        onClick={() => { setError(""); setOpen(true) }}
      >
        <Trash2 className="h-4 w-4 mr-1.5" />
        Delete
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!isPending) setOpen(v) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Invoice <span className="font-medium text-foreground">{invoiceLabel}</span> will be permanently deleted.
              All linked production entries will be unlinked and can be re-invoiced.
            </p>
            {hasPayments && (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                This invoice has recorded payments. The payment records will be kept but their allocations to this invoice will be removed.
              </p>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting…" : "Delete Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
