"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Pencil, Wand2 } from "lucide-react"
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
import { updatePayment } from "@/lib/actions/invoices"

export interface EditableInvoice {
  id: string
  invoiceNumber: string
  financialYear: string
  invoiceDate: Date
  totalAmount: number
  balance: number
  currentAlloc: number
}

interface Props {
  paymentId: string
  initialAmount: number
  initialPaymentDate: string
  initialReference: string | null
  initialNotes: string | null
  editableInvoices: EditableInvoice[]
}

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-IN")
}

export function EditPaymentDialog({
  paymentId,
  initialAmount,
  initialPaymentDate,
  initialReference,
  initialNotes,
  editableInvoices,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(initialPaymentDate)
  const [reference, setReference] = useState(initialReference ?? "")
  const [notes, setNotes] = useState(initialNotes ?? "")
  const [allocations, setAllocations] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open) {
      setAmount(String(Math.round(initialAmount)))
      setPaymentDate(initialPaymentDate)
      setReference(initialReference ?? "")
      setNotes(initialNotes ?? "")
      setAllocations(
        Object.fromEntries(
          editableInvoices.map((inv) => [
            inv.id,
            inv.currentAlloc > 0 ? String(inv.currentAlloc) : "",
          ])
        )
      )
      setError("")
    }
  }, [open, initialAmount, initialPaymentDate, initialReference, initialNotes, editableInvoices])

  const paymentAmount = Math.round(parseFloat(amount) || 0)
  const totalAllocated = editableInvoices.reduce(
    (s, inv) => s + (Math.round(parseFloat(allocations[inv.id] || "0") || 0)),
    0
  )
  const remaining = paymentAmount - totalAllocated
  const isBalanced = paymentAmount > 0 && remaining === 0

  function autoFill() {
    if (!paymentAmount) return
    let rem = paymentAmount
    const next: Record<string, string> = {}
    for (const inv of editableInvoices) {
      const apply = Math.min(rem, Math.round(inv.balance))
      next[inv.id] = apply > 0 ? String(apply) : ""
      rem = rem - apply
      if (rem <= 0) break
    }
    for (const inv of editableInvoices) {
      if (!(inv.id in next)) next[inv.id] = ""
    }
    setAllocations(next)
  }

  function setAlloc(invoiceId: string, value: string) {
    setAllocations((prev) => ({ ...prev, [invoiceId]: value }))
  }

  function handleSubmit() {
    setError("")
    if (!paymentAmount || paymentAmount <= 0) { setError("Enter a valid payment amount"); return }
    if (!paymentDate) { setError("Select a payment date"); return }
    if (!isBalanced) {
      setError(`Allocated ₹${fmt(totalAllocated)} — must equal payment ₹${fmt(paymentAmount)}`)
      return
    }

    const allocs = editableInvoices
      .map((inv) => ({ invoiceId: inv.id, amount: Math.round(parseFloat(allocations[inv.id] || "0") || 0) }))
      .filter((a) => a.amount > 0)

    if (allocs.length === 0) { setError("Allocate amount to at least one invoice"); return }

    for (const inv of editableInvoices) {
      const alloc = Math.round(parseFloat(allocations[inv.id] || "0") || 0)
      if (alloc > Math.round(inv.balance)) {
        setError(`Allocation for #${inv.invoiceNumber} exceeds available balance ₹${fmt(inv.balance)}`)
        return
      }
    }

    startTransition(async () => {
      try {
        await updatePayment(paymentId, {
          amount: paymentAmount,
          paymentDate,
          reference: reference || undefined,
          notes: notes || undefined,
          allocations: allocs,
        })
        setOpen(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update payment")
      }
    })
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4 mr-1.5" />
        Edit
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!isPending) setOpen(v) }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Amount Received <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reference</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="NEFT/Cheque No."
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Allocate to Invoices</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={autoFill}
                  disabled={!paymentAmount}
                  className="h-7 text-xs"
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  Auto-fill
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Invoice</th>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Date</th>
                      <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Total</th>
                      <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Available</th>
                      <th className="text-right px-3 py-2.5 font-medium text-muted-foreground w-36">Allocate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {editableInvoices.map((inv) => {
                      const alloc = Math.round(parseFloat(allocations[inv.id] || "0") || 0)
                      const overLimit = alloc > Math.round(inv.balance)
                      return (
                        <tr key={inv.id}>
                          <td className="px-3 py-2 font-mono text-blue-600 font-medium">
                            #{inv.invoiceNumber}/{inv.financialYear}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {format(new Date(inv.invoiceDate), "dd.MM.yyyy")}
                          </td>
                          <td className="px-3 py-2 text-right">₹{fmt(inv.totalAmount)}</td>
                          <td className="px-3 py-2 text-right text-red-600 font-medium">
                            ₹{fmt(inv.balance)}
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              step="1"
                              value={allocations[inv.id] ?? ""}
                              onChange={(e) => setAlloc(inv.id, e.target.value)}
                              placeholder="0"
                              className={`h-8 text-right text-sm ${overLimit ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium ${
              !paymentAmount
                ? "bg-gray-50 text-muted-foreground"
                : isBalanced
                ? "bg-green-50 text-green-800"
                : remaining > 0
                ? "bg-yellow-50 text-yellow-800"
                : "bg-red-50 text-red-800"
            }`}>
              <span>Allocated: ₹{fmt(totalAllocated)} / ₹{fmt(paymentAmount || 0)}</span>
              {paymentAmount > 0 && !isBalanced && (
                <span>
                  {remaining > 0 ? `₹${fmt(remaining)} unallocated` : `₹${fmt(Math.abs(remaining))} over`}
                </span>
              )}
              {isBalanced && <span>✓ Balanced</span>}
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !isBalanced}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
