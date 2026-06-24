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
import { deleteDC } from "@/lib/actions/dcs"

interface Props {
  dcId: string
  dcLabel: string
}

export function DeleteDCButton({ dcId, dcLabel }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError("")
    startTransition(async () => {
      try {
        await deleteDC(dcId)
        router.push("/admin/dcs")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete DC")
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
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete DC</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            DC <span className="font-medium text-foreground">{dcLabel}</span> will be permanently deleted.
            All linked entries will be unlinked and can be re-assigned to another DC.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting…" : "Delete DC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
