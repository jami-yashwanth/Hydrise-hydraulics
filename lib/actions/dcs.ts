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
