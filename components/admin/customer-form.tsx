"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/ui/submit-button"
import Link from "next/link"

interface Props {
  action: (formData: FormData) => Promise<void>
  defaultValues?: {
    name: string
    email?: string | null
    phone?: string | null
    gstin?: string | null
    address?: string | null
    stateCode?: string | null
    taxType?: string | null
  }
}

export function CustomerForm({ action, defaultValues }: Props) {
  const [taxType, setTaxType] = useState(defaultValues?.taxType ?? "INTRASTATE")

  return (
    <form action={action} className="bg-white border rounded-lg p-5 space-y-4">
      <input type="hidden" name="taxType" value={taxType} />
      <div className="space-y-1.5">
        <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="gstin">GSTIN <span className="text-destructive">*</span></Label>
        <Input id="gstin" name="gstin" defaultValue={defaultValues?.gstin ?? ""} placeholder="22AAAAA0000A1Z5" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Address <span className="text-destructive">*</span></Label>
        <textarea
          id="address"
          name="address"
          defaultValue={defaultValues?.address ?? ""}
          rows={3}
          required
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          placeholder="Enter customer address"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stateCode">State Code <span className="text-destructive">*</span></Label>
        <Input id="stateCode" name="stateCode" defaultValue={defaultValues?.stateCode ?? ""} placeholder="e.g. 29" required />
      </div>
      <div className="space-y-1.5">
        <Label>Tax Type</Label>
        <div className="flex gap-2">
          {(["INTRASTATE", "INTERSTATE", "EXEMPT"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTaxType(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                taxType === t
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-200 text-muted-foreground hover:bg-gray-50"
              }`}
            >
              {t === "INTRASTATE" ? "Intrastate (CGST+SGST)" : t === "INTERSTATE" ? "Interstate (IGST)" : "Exempt"}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {taxType === "INTRASTATE" && "18% GST split as CGST 9% + SGST 9%"}
          {taxType === "INTERSTATE" && "18% GST as IGST"}
          {taxType === "EXEMPT" && "No GST applicable"}
        </p>
      </div>
      <div className="flex gap-3 pt-2">
        <SubmitButton>{defaultValues ? "Save changes" : "Add Customer"}</SubmitButton>
        <Button variant="outline" asChild><Link href="/admin/customers">Cancel</Link></Button>
      </div>
    </form>
  )
}
