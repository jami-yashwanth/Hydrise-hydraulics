"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

function getFinancialYear(date: Date): string {
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  if (month >= 4) return `${year}-${(year + 1).toString().slice(2)}`
  return `${year - 1}-${year.toString().slice(2)}`
}

export async function getNextDCNumber(dcDate: string): Promise<string> {
  const fy = getFinancialYear(new Date(dcDate))
  const count = await prisma.dC.count({ where: { financialYear: fy } })
  return String(count + 1).padStart(3, "0")
}

export async function unlinkEntryFromDC(entryId: string, dcId: string) {
  const entry = await prisma.productionEntry.findUnique({
    where: { id: entryId },
    select: { dcId: true, invoiceId: true },
  })
  if (!entry) throw new Error("Entry not found")
  if (entry.dcId !== dcId) throw new Error("Entry is not linked to this DC")
  if (entry.invoiceId) throw new Error("Cannot unlink an invoiced entry")
  await prisma.productionEntry.update({ where: { id: entryId }, data: { dcId: null } })
  revalidatePath(`/admin/dcs/${dcId}`)
  revalidatePath("/admin/production")
}

export async function linkEntriesToDC(dcId: string, entryIds: string[]) {
  if (entryIds.length === 0) throw new Error("No entries selected")
  const entries = await prisma.productionEntry.findMany({
    where: { id: { in: entryIds }, dcId: null, invoiceId: null, status: "SUCCESS" },
    select: { id: true },
  })
  if (entries.length !== entryIds.length) throw new Error("Some entries are not eligible to link")
  await prisma.productionEntry.updateMany({
    where: { id: { in: entryIds } },
    data: { dcId },
  })
  revalidatePath(`/admin/dcs/${dcId}`)
  revalidatePath("/admin/production")
}

export async function deleteDC(id: string) {
  const dc = await prisma.dC.findUnique({
    where: { id },
    include: { entries: { select: { id: true, invoiceId: true } } },
  })
  if (!dc) throw new Error("DC not found")
  if (dc.entries.some((e) => e.invoiceId)) throw new Error("Cannot delete a DC with invoiced entries")

  await prisma.productionEntry.updateMany({
    where: { dcId: id },
    data: { dcId: null },
  })
  await prisma.dC.delete({ where: { id } })
  revalidatePath("/admin/dcs")
  revalidatePath("/admin/production")
}

export async function linkInvoicedEntriesToDC(dcId: string, entryIds: string[]) {
  if (entryIds.length === 0) throw new Error("No entries selected")
  const entries = await prisma.productionEntry.findMany({
    where: { id: { in: entryIds }, dcId: null, status: "SUCCESS" },
    select: { id: true },
  })
  if (entries.length !== entryIds.length) throw new Error("Some entries are already linked to a DC or not eligible")
  await prisma.productionEntry.updateMany({
    where: { id: { in: entryIds } },
    data: { dcId },
  })
  revalidatePath("/admin/invoices")
  revalidatePath("/admin/production")
  revalidatePath(`/admin/dcs/${dcId}`)
}

export async function unlinkEntryFromDCForInvoice(entryId: string, dcId: string) {
  const entry = await prisma.productionEntry.findUnique({
    where: { id: entryId },
    select: { dcId: true },
  })
  if (!entry) throw new Error("Entry not found")
  if (entry.dcId !== dcId) throw new Error("Entry is not linked to this DC")
  await prisma.productionEntry.update({ where: { id: entryId }, data: { dcId: null } })
  revalidatePath("/admin/invoices")
  revalidatePath("/admin/production")
  revalidatePath(`/admin/dcs/${dcId}`)
}

export async function getEntriesForDCs(dcIds: string[]) {
  if (dcIds.length === 0) return { entries: [], customer: null }
  const [entries, dc] = await Promise.all([
    prisma.productionEntry.findMany({
      where: { dcId: { in: dcIds }, invoiceId: null },
      select: { id: true, totalCost: true },
    }),
    prisma.dC.findFirst({
      where: { id: { in: dcIds } },
      select: { customer: { select: { id: true, name: true, taxType: true } } },
    }),
  ])
  return { entries, customer: dc?.customer ?? null }
}

export async function saveDCPrintParams(id: string, params: {
  orderNo?: string
  orderDate?: string
  vehicleNo?: string
}) {
  await prisma.dC.update({
    where: { id },
    data: {
      lastOrderNo: params.orderNo || null,
      lastOrderDate: params.orderDate || null,
      lastVehicleNo: params.vehicleNo || null,
    },
  })
}

export async function createDC(data: {
  productionEntryIds: string[]
  customerId: string
  dcDate: string
}) {
  const { productionEntryIds, customerId, dcDate } = data

  const entries = await prisma.productionEntry.findMany({
    where: {
      id: { in: productionEntryIds },
      dcId: null,
      status: "SUCCESS",
      invoiceId: null,
    },
  })

  if (entries.length === 0) throw new Error("No valid entries selected for DC")
  if (entries.length !== productionEntryIds.length)
    throw new Error("Some entries already have a DC or are not eligible")

  const dcDateObj = new Date(dcDate)
  const fy = getFinancialYear(dcDateObj)

  const count = await prisma.dC.count({ where: { financialYear: fy } })
  const dcNumber = String(count + 1).padStart(3, "0")

  const dc = await prisma.dC.create({
    data: {
      dcNumber,
      financialYear: fy,
      dcDate: dcDateObj,
      customerId,
    },
  })

  await prisma.productionEntry.updateMany({
    where: { id: { in: productionEntryIds } },
    data: { dcId: dc.id },
  })

  revalidatePath("/admin/production")
  return dc
}
