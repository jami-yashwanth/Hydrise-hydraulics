"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createCustomer(formData: FormData) {
  const name = formData.get("name") as string
  const email = (formData.get("email") as string) || null
  const phone = (formData.get("phone") as string) || null
  const gstin = (formData.get("gstin") as string) || null
  const address = (formData.get("address") as string) || null
  const stateCode = (formData.get("stateCode") as string) || null
  const taxType = (formData.get("taxType") as string) || "INTRASTATE"

  if (!name?.trim()) throw new Error("Name is required")
  if (!gstin?.trim()) throw new Error("GSTIN is required")
  if (!address?.trim()) throw new Error("Address is required")
  if (!stateCode?.trim()) throw new Error("State Code is required")

  await prisma.customer.create({ data: { name: name.trim(), email: email?.trim() || null, phone: phone?.trim() || null, gstin: gstin.trim(), address: address.trim(), stateCode: stateCode.trim(), taxType: taxType as "INTRASTATE" | "INTERSTATE" | "EXEMPT" } })
  revalidatePath("/admin/customers")
  redirect("/admin/customers")
}

export async function updateCustomer(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const email = (formData.get("email") as string) || null
  const phone = (formData.get("phone") as string) || null
  const gstin = (formData.get("gstin") as string) || null
  const address = (formData.get("address") as string) || null
  const stateCode = (formData.get("stateCode") as string) || null
  const taxType = (formData.get("taxType") as string) || "INTRASTATE"

  if (!name?.trim()) throw new Error("Name is required")
  if (!gstin?.trim()) throw new Error("GSTIN is required")
  if (!address?.trim()) throw new Error("Address is required")
  if (!stateCode?.trim()) throw new Error("State Code is required")

  await prisma.customer.update({
    where: { id },
    data: { name: name.trim(), email: email?.trim() || null, phone: phone?.trim() || null, gstin: gstin.trim(), address: address.trim(), stateCode: stateCode.trim(), taxType: taxType as "INTRASTATE" | "INTERSTATE" | "EXEMPT" },
  })
  revalidatePath("/admin/customers")
  redirect("/admin/customers")
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } })
  revalidatePath("/admin/customers")
}
