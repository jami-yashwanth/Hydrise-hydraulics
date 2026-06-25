"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { PlusCircle, Wand2 } from "lucide-react"
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
import { recordPayment, getOutstandingInvoices } from "@/lib/actions/invoices"

type OutstandingInvoice = Awaited<ReturnType<typeof getOutstandingInvoices>>[number]

interface Props {
  customerId: string
  customerName: string
}

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-IN")
}

export function RecordPaymentDialog({ customerId, customerName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [invoices, setInvoices] = useState<OutstandingInvoice[]>([])
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [allocations, setAllocations] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  async function handleOpen() {
    setAmount("")
    setReference("")
    setNotes("")
    setError("")
    setAllocations({})
    setLoading(true)
    setOpen(true)
    setPaymentDate(format(new Date(), "yyyy-MM-dd"))
    const data = await getOutstandingInvoices(customerId)
    setInvoices(data)
    setAllocations(Object.fromEntries(data.map((inv: OutstandingInvoice) => [inv.id, ""])))
    setLoading(false)
  }

  const paymentAmount = Math.round(parseFloat(amount) || 0)
  const totalAllocated = invoices.reduce(
    (s, inv) => s + (Math.round(parseFloat(allocations[inv.id] || "0") || 0)),
    0,
  )
  const remaining = paymentAmount - totalAllocated
  const isBalanced = paymentAmount > 0 && remaining === 0

  function autoFill() {
    if (!paymentAmount) return
    let rem = paymentAmount
    const next: Record<string, string> = {}
    for (const inv of invoices) {
      const apply = Math.min(rem, Math.round(inv.balance))
      next[inv.id] = apply > 0 ? String(apply) : ""
      rem = rem - apply
      if (rem <= 0) break
    }
    for (const inv of invoices) {
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
    if (!isBalanced) { setError(`Allocated ₹${fmt(totalAllocated)} — must equal payment ₹${fmt(paymentAmount)}`); return }

    const allocs = invoices
      .map((inv) => ({ invoiceId: inv.id, amount: Math.round(parseFloat(allocations[inv.id] || "0") || 0) }))
      .filter((a) => a.amount > 0)

    if (allocs.length === 0) { setError("Allocate amount to at least one invoice"); return }

    for (const inv of invoices) {
      const alloc = Math.round(parseFloat(allocations[inv.id] || "0") || 0)
      if (alloc > Math.round(inv.balance)) {
        setError(`Allocation for #${inv.invoiceNumber} exceeds balance ₹${fmt(inv.balance)}`)
        return
      }
    }

    startTransition(async () => {
      try {
        await recordPayment({
          customerId,
          amount: paymentAmount,
          paymentDate,
          reference: reference || undefined,
          notes: notes || undefined,
          allocations: allocs,
        })
        setOpen(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to record payment")
      }
    })
  }

  return (
    <>
      <Button size="sm" onClick={handleOpen}>
        <PlusCircle className="h-4 w-4 mr-1.5" />
        Record Payment
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!isPending && !loading) setOpen(v) }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Record Payment — {customerName}</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading invoices…</div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No outstanding invoices for this customer.</div>
          ) : (
            <div className="space-y-5">
              {/* Payment details */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount Received <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
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

              {/* Allocation table */}
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
                        <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Balance</th>
                        <th className="text-right px-3 py-2.5 font-medium text-muted-foreground w-36">Allocate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoices.map((inv) => {
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
                                step="0.01"
                                value={allocations[inv.id] ?? ""}
                                onChange={(e) => setAlloc(inv.id, e.target.value)}
                                placeholder="0.00"
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

              {/* Running total */}
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
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending || loading}>
              Cancel
            </Button>
            {!loading && invoices.length > 0 && (
              <Button onClick={handleSubmit} disabled={isPending || !isBalanced}>
                {isPending ? "Saving..." : "Save Payment"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
