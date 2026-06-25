"use client"

import React, { useState, useTransition, useEffect } from "react"
import { format } from "date-fns"
import { FileText } from "lucide-react"
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
import { getPendingDCsForCustomer } from "@/lib/actions/dcs"
import { createInvoice } from "@/lib/actions/invoices"
import { GST_CONFIG } from "@/lib/config"

type PendingDC = {
  id: string
  dcNumber: string
  financialYear: string
  dcDate: Date
  entries: { id: string; totalCost: number }[]
}

interface Props {
  customerId: string
  customerName: string
  customerTaxType: string
}

function calcTax(
  basic: number,
  taxType: string,
  cgstPct: number,
  sgstPct: number,
  igstPct: number,
) {
  if (taxType === "INTRASTATE") {
    const cgst = parseFloat((basic * cgstPct / 100).toFixed(2))
    const sgst = parseFloat((basic * sgstPct / 100).toFixed(2))
    return { cgst, sgst, igst: 0, total: parseFloat((basic + cgst + sgst).toFixed(2)) }
  }
  if (taxType === "INTERSTATE") {
    const igst = parseFloat((basic * igstPct / 100).toFixed(2))
    return { cgst: 0, sgst: 0, igst, total: parseFloat((basic + igst).toFixed(2)) }
  }
  return { cgst: 0, sgst: 0, igst: 0, total: basic }
}

export function CreateInvoiceDialog({ customerId, customerName, customerTaxType }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [dcs, setDcs] = useState<PendingDC[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [cgstPct, setCgstPct] = useState(GST_CONFIG.cgstPercent)
  const [sgstPct, setSgstPct] = useState(GST_CONFIG.sgstPercent)
  const [igstPct, setIgstPct] = useState(GST_CONFIG.igstPercent)
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  async function handleOpen() {
    setError("")
    setSelectedIds(new Set())
    setLoading(true)
    setOpen(true)
    setInvoiceDate(format(new Date(), "yyyy-MM-dd"))
    const fetched = await getPendingDCsForCustomer(customerId)
    setDcs(fetched)
    setLoading(false)
  }

  const grouped = dcs.reduce<Record<string, PendingDC[]>>((acc, dc) => {
    const key = format(new Date(dc.dcDate), "MMMM yyyy")
    ;(acc[key] ??= []).push(dc)
    return acc
  }, {})

  const allIds = dcs.map((dc) => dc.id)
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

  const selectedDCs = dcs.filter((dc) => selectedIds.has(dc.id))
  const allEntryIds = selectedDCs.flatMap((dc) => dc.entries.map((e) => e.id))
  const basicTotal = selectedDCs.reduce(
    (sum, dc) => sum + dc.entries.reduce((s, e) => s + e.totalCost, 0),
    0,
  )
  const tax = calcTax(basicTotal, customerTaxType, cgstPct, sgstPct, igstPct)

  function handleCreate() {
    setError("")
    startTransition(async () => {
      try {
        await createInvoice({
          productionEntryIds: allEntryIds,
          invoiceDate,
          customerId,
          cgstPercent: cgstPct,
          sgstPercent: sgstPct,
          igstPercent: igstPct,
        })
        setOpen(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create invoice")
      }
    })
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleOpen}>
        <FileText className="h-4 w-4 mr-1.5" />
        Create Invoice
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
            <DialogTitle>Create Invoice — {customerName}</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-16 text-sm text-muted-foreground">
              Loading pending DCs…
            </div>
          ) : dcs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-16 text-sm text-muted-foreground">
              No pending DCs for this customer.
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
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground align-middle">DC No.</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground align-middle">FY</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground align-middle">Date</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground align-middle">Items</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground align-middle">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(grouped).map(([month, monthDCs]) => (
                    <React.Fragment key={month}>
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-1.5 bg-gray-100 text-xs font-semibold text-muted-foreground"
                        >
                          {month}
                        </td>
                      </tr>
                      {monthDCs.map((dc) => {
                        const dcTotal = dc.entries.reduce((s, e) => s + e.totalCost, 0)
                        return (
                          <tr
                            key={dc.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => toggleOne(dc.id)}
                          >
                            <td
                              className="px-3 py-2.5 text-center align-middle"
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={selectedIds.has(dc.id)}
                                onChange={() => toggleOne(dc.id)}
                                className="rounded accent-gray-900"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-center align-middle font-mono font-semibold text-blue-700">
                              #{dc.dcNumber}
                            </td>
                            <td className="px-3 py-2.5 text-center align-middle text-muted-foreground">
                              {dc.financialYear}
                            </td>
                            <td className="px-3 py-2.5 text-center align-middle">
                              {format(new Date(dc.dcDate), "dd.MM.yyyy")}
                            </td>
                            <td className="px-3 py-2.5 text-center align-middle text-muted-foreground">
                              {dc.entries.length} Nos.
                            </td>
                            <td className="px-3 py-2.5 text-center align-middle font-medium">
                              ₹{Math.round(dcTotal).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {dcs.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Selected: </span>
                  <span className="font-medium">{selectedIds.size} DCs · {allEntryIds.length} entries</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Basic: </span>
                  <span className="font-medium">₹{Math.round(basicTotal).toLocaleString("en-IN")}</span>
                </div>
                {customerTaxType === "INTRASTATE" && (
                  <>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span>CGST</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={cgstPct}
                        onChange={(e) => setCgstPct(parseFloat(e.target.value) || 0)}
                        className="w-14 h-6 text-xs border border-input rounded px-1.5 bg-white text-center"
                      />
                      <span>%</span>
                      <span className="font-medium text-foreground ml-1">
                        ₹{Math.round(tax.cgst).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span>SGST</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={sgstPct}
                        onChange={(e) => setSgstPct(parseFloat(e.target.value) || 0)}
                        className="w-14 h-6 text-xs border border-input rounded px-1.5 bg-white text-center"
                      />
                      <span>%</span>
                      <span className="font-medium text-foreground ml-1">
                        ₹{Math.round(tax.sgst).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </>
                )}
                {customerTaxType === "INTERSTATE" && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span>IGST</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={igstPct}
                      onChange={(e) => setIgstPct(parseFloat(e.target.value) || 0)}
                      className="w-14 h-6 text-xs border border-input rounded px-1.5 bg-white text-center"
                    />
                    <span>%</span>
                    <span className="font-medium text-foreground ml-1">
                      ₹{Math.round(tax.igst).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-semibold text-base">₹{Math.round(tax.total).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex items-end gap-4">
                <div className="space-y-1.5">
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
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
              {isPending ? "Creating…" : `Generate Invoice (${selectedIds.size} DCs)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
