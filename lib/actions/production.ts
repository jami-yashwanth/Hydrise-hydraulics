"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function calcArea(diaMm: number, lengthMm: number) {
  return parseFloat(((Math.PI * diaMm * lengthMm) / 645.16).toFixed(2))
}

function parseDate(val: string | null): Date | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function parseFloat2(val: FormDataEntryValue | null): number {
  if (!val) return 0
  const n = parseFloat(val as string)
  return isNaN(n) ? 0 : n
}

export async function createProductionEntry(formData: FormData) {
  const diaMm = parseFloat2(formData.get("rodDiaMm"))
  const lengthMm = parseFloat2(formData.get("rodLengthMm"))
  const area = calcArea(diaMm, lengthMm)
  const costPerSqIn = parseFloat2(formData.get("costPerSqIn"))
  const totalCostRaw = formData.get("totalCost") as string
  const totalCost = totalCostRaw ? parseFloat(totalCostRaw) : area * costPerSqIn
  const jobType = (formData.get("jobType") as string)?.trim()
  const description = (formData.get("description") as string)?.trim()
  const quantity = parseInt(formData.get("quantity") as string) || 1

  if (!jobType) throw new Error("Job Type is required")
  if (!description) throw new Error("Description is required")

  await prisma.productionEntry.create({
    data: {
      chromePlatingDate: new Date(formData.get("chromePlatingDate") as string),
      customerDcNo: (formData.get("customerDcNo") as string) || null,
      customerDcDate: parseDate(formData.get("customerDcDate") as string),
      customerId: formData.get("customerId") as string,
      employeeId: (formData.get("employeeId") as string) || null,
      rodDiaMm: diaMm,
      rodLengthMm: lengthMm,
      chromePlatingMicrons: parseFloat2(formData.get("chromePlatingMicrons")) || 30,
      area,
      costPerSqIn,
      totalCost: isNaN(totalCost) ? 0 : totalCost,
      quantity,
      jobType,
      description,
      additionalRequirements: (formData.get("additionalRequirements") as string) || null,
      inTime: (formData.get("inTime") as string) || null,
      outTime: (formData.get("outTime") as string) || null,
      temperature: parseFloat2(formData.get("temperature")) || null,
      density: parseFloat2(formData.get("density")) || null,
      cathodeCurrent: parseFloat2(formData.get("cathodeCurrent")) || null,
      anodeCurrent: parseFloat2(formData.get("anodeCurrent")) || null,
      currentReading: (formData.get("currentReading") as string) || null,
      chromeThickness: (formData.get("chromeThickness") as string) || null,
      remarks: (formData.get("remarks") as string) || null,
      status: (formData.get("status") as "PENDING" | "SUCCESS" | "FAILED") || "PENDING",
    },
  })

  revalidatePath("/admin/production")
  redirect("/admin/production")
}

export async function updateProductionEntry(id: string, formData: FormData) {
  const diaMm = parseFloat2(formData.get("rodDiaMm"))
  const lengthMm = parseFloat2(formData.get("rodLengthMm"))
  const area = calcArea(diaMm, lengthMm)
  const costPerSqIn = parseFloat2(formData.get("costPerSqIn"))
  const totalCostRaw = formData.get("totalCost") as string
  const totalCost = totalCostRaw ? parseFloat(totalCostRaw) : area * costPerSqIn
  const status = (formData.get("status") as "PENDING" | "SUCCESS" | "FAILED") || "PENDING"
  const jobType = (formData.get("jobType") as string)?.trim()
  const description = (formData.get("description") as string)?.trim()
  const quantity = parseInt(formData.get("quantity") as string) || 1

  if (!jobType) throw new Error("Job Type is required")
  if (!description) throw new Error("Description is required")

  await prisma.productionEntry.update({
    where: { id },
    data: {
      chromePlatingDate: new Date(formData.get("chromePlatingDate") as string),
      customerDcNo: (formData.get("customerDcNo") as string) || null,
      customerDcDate: parseDate(formData.get("customerDcDate") as string),
      customerId: formData.get("customerId") as string,
      employeeId: (formData.get("employeeId") as string) || null,
      rodDiaMm: diaMm,
      rodLengthMm: lengthMm,
      chromePlatingMicrons: parseFloat2(formData.get("chromePlatingMicrons")) || 30,
      area,
      costPerSqIn,
      totalCost: status === "FAILED" ? 0 : (isNaN(totalCost) ? 0 : totalCost),
      quantity,
      jobType,
      description,
      additionalRequirements: (formData.get("additionalRequirements") as string) || null,
      inTime: (formData.get("inTime") as string) || null,
      outTime: (formData.get("outTime") as string) || null,
      temperature: parseFloat2(formData.get("temperature")) || null,
      density: parseFloat2(formData.get("density")) || null,
      cathodeCurrent: parseFloat2(formData.get("cathodeCurrent")) || null,
      anodeCurrent: parseFloat2(formData.get("anodeCurrent")) || null,
      currentReading: (formData.get("currentReading") as string) || null,
      chromeThickness: (formData.get("chromeThickness") as string) || null,
      remarks: (formData.get("remarks") as string) || null,
      status,
    },
  })

  revalidatePath("/admin/production")
  redirect("/admin/production")
}

export async function createRedoEntry(originalId: string) {
  const original = await prisma.productionEntry.findUnique({ where: { id: originalId } })
  if (!original) throw new Error("Original entry not found")

  const newEntry = await prisma.productionEntry.create({
    data: {
      chromePlatingDate: new Date(),
      customerDcNo: original.customerDcNo,
      customerDcDate: original.customerDcDate,
      customerId: original.customerId,
      employeeId: original.employeeId,
      rodDiaMm: original.rodDiaMm,
      rodLengthMm: original.rodLengthMm,
      chromePlatingMicrons: original.chromePlatingMicrons,
      area: original.area,
      costPerSqIn: original.costPerSqIn,
      totalCost: 0,
      quantity: original.quantity,
      jobType: original.jobType,
      description: original.description,
      additionalRequirements: original.additionalRequirements,
      status: "PENDING",
      redoOfId: originalId,
    },
  })

  revalidatePath("/admin/production")
  return newEntry.id
}
