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
import { updateDC } from "@/lib/actions/dcs"

interface Props {
  dcId: string
  initialDcDate: string
}

export function EditDCDialog({ dcId, initialDcDate }: Props) {
  const [open, setOpen] = useState(false)
  const [dcDate, setDcDate] = useState(initialDcDate)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpen() {
    setDcDate(initialDcDate)
    setError(null)
    setOpen(true)
  }

  async function handleSave() {
    setLoading(true)
    setError(null)
    try {
      await updateDC(dcId, { dcDate })
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update DC")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <Pencil className="h-4 w-4 mr-1.5" />
        Edit DC
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Delivery Challan</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="dc-date">DC Date</Label>
              <Input
                id="dc-date"
                type="date"
                value={dcDate}
                onChange={(e) => setDcDate(e.target.value)}
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
