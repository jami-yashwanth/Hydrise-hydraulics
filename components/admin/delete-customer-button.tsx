"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteCustomer } from "@/lib/actions/customers"
import { useTransition } from "react"

export function DeleteCustomerButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:text-destructive"
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete customer "${name}"?`)) {
          startTransition(() => deleteCustomer(id))
        }
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}
