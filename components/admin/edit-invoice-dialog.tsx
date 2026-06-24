"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateInvoice } from "@/lib/actions/invoices"

interface Props {
  invoiceId: string
  initialInvoiceDate: string
  initialRemarks?: string | null
}

export function EditInvoiceDialog({ invoiceId, initialInvoiceDate, initialRemarks }: Props) {
  const [open, setOpen] = useState(false)
  const [invoiceDate, setInvoiceDate] = useState(initialInvoiceDate)
  const [remarks, setRemarks] = useState(initialRemarks ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpen() {
    setInvoiceDate(initialInvoiceDate)
    setRemarks(initialRemarks ?? "")
    setError(null)
    setOpen(true)
  }

  async function handleSave() {
    setLoading(true)
    setError(null)
    try {
      await updateInvoice(invoiceId, { invoiceDate, remarks })
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update invoice")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <Pencil className="h-4 w-4 mr-1.5" />
        Edit Invoice
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="invoice-date">Invoice Date</Label>
              <Input
                id="invoice-date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Optional remarks…"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
