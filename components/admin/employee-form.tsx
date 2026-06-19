"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/ui/submit-button"
import Link from "next/link"

interface Props {
  action: (formData: FormData) => Promise<void>
  defaultValues?: { name: string; designation?: string | null; phone?: string | null; address?: string | null; aadhar?: string | null; fatherName?: string | null }
}

export function EmployeeForm({ action, defaultValues }: Props) {
  return (
    <form action={action} className="bg-white border rounded-lg p-5 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="designation">Designation</Label>
        <Input id="designation" name="designation" defaultValue={defaultValues?.designation ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fatherName">Father Name</Label>
        <Input id="fatherName" name="fatherName" defaultValue={defaultValues?.fatherName ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="aadhar">Aadhar Number</Label>
        <Input id="aadhar" name="aadhar" defaultValue={defaultValues?.aadhar ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <textarea
          id="address"
          name="address"
          defaultValue={defaultValues?.address ?? ""}
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          placeholder="Enter employee address"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <SubmitButton>{defaultValues ? "Save changes" : "Add Employee"}</SubmitButton>
        <Button variant="outline" asChild><Link href="/admin/employees">Cancel</Link></Button>
      </div>
    </form>
  )
}
