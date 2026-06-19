"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createRedoEntry } from "@/lib/actions/production"

export function RedoJobButton({ originalId }: { originalId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (confirm("Create a redo entry for this failed job? The new entry will be pre-filled with the same details.")) {
          startTransition(async () => {
            const newId = await createRedoEntry(originalId)
            router.push(`/admin/production/${newId}`)
          })
        }
      }}
    >
      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
      {pending ? "Creating..." : "Redo Job"}
    </Button>
  )
}
