"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createEmployee(formData: FormData) {
  const name = formData.get("name") as string
  const designation = (formData.get("designation") as string) || null
  const phone = (formData.get("phone") as string) || null
  const address = (formData.get("address") as string) || null
  const aadhar = (formData.get("aadhar") as string) || null
  const fatherName = (formData.get("fatherName") as string) || null

  if (!name?.trim()) throw new Error("Name is required")

  await prisma.employee.create({ data: { name: name.trim(), designation: designation?.trim() || null, phone: phone?.trim() || null, address: address?.trim() || null, aadhar: aadhar?.trim() || null, fatherName: fatherName?.trim() || null } })
  revalidatePath("/admin/employees")
  redirect("/admin/employees")
}

export async function updateEmployee(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const designation = (formData.get("designation") as string) || null
  const phone = (formData.get("phone") as string) || null
  const address = (formData.get("address") as string) || null
  const aadhar = (formData.get("aadhar") as string) || null
  const fatherName = (formData.get("fatherName") as string) || null

  if (!name?.trim()) throw new Error("Name is required")

  await prisma.employee.update({
    where: { id },
    data: { name: name.trim(), designation: designation?.trim() || null, phone: phone?.trim() || null, address: address?.trim() || null, aadhar: aadhar?.trim() || null, fatherName: fatherName?.trim() || null },
  })
  revalidatePath("/admin/employees")
  redirect("/admin/employees")
}

export async function deleteEmployee(id: string) {
  await prisma.employee.delete({ where: { id } })
  revalidatePath("/admin/employees")
}
