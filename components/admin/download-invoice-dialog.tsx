"use client"

import { useState } from "react"
import { Download, Pencil, RotateCcw } from "lucide-react"
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
import { saveInvoicePrintParams } from "@/lib/actions/invoices"

interface Props {
  invoiceId: string
  initialValues?: {
    poNo?: string | null
    vehicleNo?: string | null
    hsn?: string | null
    reverseCharge?: string | null
  }
}

export function DownloadInvoiceDialog({ invoiceId, initialValues }: Props) {
  const hasSaved = !!(
    initialValues?.poNo ||
    initialValues?.vehicleNo ||
    initialValues?.hsn ||
    initialValues?.reverseCharge
  )

  const [open, setOpen] = useState(false)
  const [locked, setLocked] = useState(hasSaved)
  const [poNo, setPoNo] = useState(initialValues?.poNo ?? "")
  const [vehicleNo, setVehicleNo] = useState(initialValues?.vehicleNo ?? "")
  const [hsn, setHsn] = useState(initialValues?.hsn ?? "")
  const [reverseCharge, setReverseCharge] = useState<"No" | "Yes">(
    (initialValues?.reverseCharge as "No" | "Yes") ?? "No"
  )

  function handleOpen() {
    setLocked(hasSaved)
    setOpen(true)
  }

  async function handleGenerate() {
    await saveInvoicePrintParams(invoiceId, {
      poNo: poNo.trim(),
      vehicleNo: vehicleNo.trim(),
      hsn: hsn.trim(),
      reverseCharge,
    })
    const params = new URLSearchParams()
    if (poNo.trim()) params.set("poNo", poNo.trim())
    if (vehicleNo.trim()) params.set("vehicleNo", vehicleNo.trim())
    if (hsn.trim()) params.set("hsn", hsn.trim())
    params.set("reverseCharge", reverseCharge)
    window.open(`/api/invoices/${invoiceId}/print?${params.toString()}`, "_blank")
    setOpen(false)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <Download className="h-4 w-4 mr-1.5" />
        Download PDF
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Generate Invoice PDF</DialogTitle>
          </DialogHeader>

          {hasSaved && (
            <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
              {locked ? (
                <>
                  <span className="text-amber-800">Last generated with saved values</span>
                  <button
                    type="button"
                    onClick={() => setLocked(false)}
                    className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900"
                  >
                    <Pencil className="h-3 w-3" />
                    Change
                  </button>
                </>
              ) : (
                <>
                  <span className="text-amber-800">Editing values</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPoNo(initialValues?.poNo ?? "")
                      setVehicleNo(initialValues?.vehicleNo ?? "")
                      setHsn(initialValues?.hsn ?? "")
                      setReverseCharge((initialValues?.reverseCharge as "No" | "Yes") ?? "No")
                      setLocked(true)
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Revert
                  </button>
                </>
              )}
            </div>
          )}

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="po-no">P.O. Number</Label>
              <Input
                id="po-no"
                placeholder="e.g. 55, 56, 57"
                value={poNo}
                onChange={(e) => setPoNo(e.target.value)}
                disabled={locked}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle-no">Vehicle Number</Label>
              <Input
                id="vehicle-no"
                placeholder="e.g. AP31 AB 1234"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                disabled={locked}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hsn">HSN / SAC Code</Label>
              <Input
                id="hsn"
                placeholder="e.g. 9988"
                value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                disabled={locked}
              />
            </div>
            <div className="space-y-1.5">
              <Label>GST Payable on Reverse Charges</Label>
              <div className="flex gap-3 pt-0.5">
                {(["No", "Yes"] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={locked}
                    onClick={() => setReverseCharge(val)}
                    className={`px-5 py-1.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      reverseCharge === val
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-muted-foreground border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate}>Generate PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
