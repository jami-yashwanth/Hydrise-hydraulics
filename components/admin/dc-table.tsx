"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { format } from "date-fns"
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react"
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
import { deleteDC } from "@/lib/actions/dcs"
import { fyMonths } from "@/lib/fy"
import { CreateInvoiceDialog } from "@/components/admin/create-invoice-dialog"

interface DC {
  id: string
  dcNumber: string
  financialYear: string
  dcDate: Date
  customer: { id: string; name: string; taxType: string }
  entryCount: number
  hasInvoicedEntries: boolean
}

interface Props {
  dcs: DC[]
  customers: { id: string; name: string; taxType: string }[]
  selectedCustomerId: string
  currentMonth: string
  currentFY: string
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

export function DCTable({ dcs, customers, selectedCustomerId, currentMonth, currentFY }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState("")

  const isCustomerView = !!selectedCustomerId
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)

  const fyMonthList = fyMonths(currentFY)
  const isFirstMonth = fyMonthList[0] === currentMonth
  const isLastMonth = fyMonthList[fyMonthList.length - 1] === currentMonth

  function navigate(month: string, customer: string) {
    const params = new URLSearchParams()
    params.set("month", month)
    if (customer) params.set("customer", customer)
    router.push(`/admin/dcs?${params.toString()}`)
  }

  function handleDelete() {
    if (!deleteId) return
    setDeleteError("")
    startTransition(async () => {
      try {
        await deleteDC(deleteId)
        setDeleteId(null)
        router.refresh()
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : "Failed to delete DC")
      }
    })
  }

  return (
    <div className="space-y-0">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-white">
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
            <SelectTrigger className="h-8 w-auto min-w-[11rem] text-sm">
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

        {isCustomerView && selectedCustomer && (
          <CreateInvoiceDialog
            customerId={selectedCustomerId}
            customerName={selectedCustomer.name}
            customerTaxType={selectedCustomer.taxType}
          />
        )}
      </div>

      {/* Table */}
      {dcs.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No delivery challans for this period.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">DC No.</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">FY</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Date</th>
              {!isCustomerView && <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>}
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Items</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {dcs.map((dc) => (
              <tr key={dc.id} className={`hover:bg-gray-50 ${dc.hasInvoicedEntries ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 text-center font-mono font-semibold">
                  <Link href={`/admin/dcs/${dc.id}`} className="text-blue-700 hover:underline">
                    #{dc.dcNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground">{dc.financialYear}</td>
                <td className="px-4 py-3 text-center">{format(new Date(dc.dcDate), "dd.MM.yyyy")}</td>
                {!isCustomerView && (
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/dcs/${dc.id}`} className="hover:underline">
                      {dc.customer.name}
                    </Link>
                  </td>
                )}
                <td className="px-4 py-3 text-center text-muted-foreground">{dc.entryCount} Nos.</td>
                <td className="px-2 py-3 text-center">
                  {!dc.hasInvoicedEntries && (
                    <button
                      type="button"
                      onClick={() => { setDeleteError(""); setDeleteId(dc.id) }}
                      className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!isPending && !open) setDeleteId(null) }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete DC</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The DC will be deleted and its entries will be unlinked. This cannot be undone.
          </p>
          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isPending}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
