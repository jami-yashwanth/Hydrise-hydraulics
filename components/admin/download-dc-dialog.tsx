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
import { saveDCPrintParams } from "@/lib/actions/dcs"

interface Props {
  dcId: string
  initialValues?: {
    orderNo?: string | null
    orderDate?: string | null
    vehicleNo?: string | null
  }
}

export function DownloadDCDialog({ dcId, initialValues }: Props) {
  const hasSaved = !!(
    initialValues?.orderNo ||
    initialValues?.orderDate ||
    initialValues?.vehicleNo
  )

  const [open, setOpen] = useState(false)
  const [locked, setLocked] = useState(hasSaved)
  const [orderNo, setOrderNo] = useState(initialValues?.orderNo ?? "")
  const [orderDate, setOrderDate] = useState(initialValues?.orderDate ?? "")
  const [vehicleNo, setVehicleNo] = useState(initialValues?.vehicleNo ?? "")

  function handleOpen() {
    setLocked(hasSaved)
    setOpen(true)
  }

  async function handleGenerate() {
    await saveDCPrintParams(dcId, {
      orderNo: orderNo.trim(),
      orderDate: orderDate.trim(),
      vehicleNo: vehicleNo.trim(),
    })
    const params = new URLSearchParams()
    if (orderNo.trim()) params.set("orderNo", orderNo.trim())
    if (orderDate.trim()) params.set("orderDate", orderDate.trim())
    if (vehicleNo.trim()) params.set("vehicleNo", vehicleNo.trim())
    window.open(`/api/dcs/${dcId}/print?${params.toString()}`, "_blank")
    setOpen(false)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <Download className="h-4 w-4 mr-1.5" />
        Download DC
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Generate DC PDF</DialogTitle>
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
                      setOrderNo(initialValues?.orderNo ?? "")
                      setOrderDate(initialValues?.orderDate ?? "")
                      setVehicleNo(initialValues?.vehicleNo ?? "")
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
              <Label htmlFor="order-no">Your Order No.</Label>
              <Input
                id="order-no"
                placeholder="e.g. SP001704"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                disabled={locked}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-date">Order Date</Label>
              <Input
                id="order-date"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
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
