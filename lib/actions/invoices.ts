"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { GST_CONFIG } from "@/lib/config"

function getFinancialYear(date: Date): string {
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  if (month >= 4) return `${year}-${(year + 1).toString().slice(2)}`
  return `${year - 1}-${year.toString().slice(2)}`
}

export async function createInvoice(data: {
  productionEntryIds: string[]
  invoiceDate: string
  customerId: string
  cgstPercent?: number
  sgstPercent?: number
  igstPercent?: number
}) {
  const {
    productionEntryIds, invoiceDate, customerId,
    cgstPercent = GST_CONFIG.cgstPercent,
    sgstPercent = GST_CONFIG.sgstPercent,
    igstPercent = GST_CONFIG.igstPercent,
  } = data

  const [entries, customer] = await Promise.all([
    prisma.productionEntry.findMany({
      where: { id: { in: productionEntryIds }, invoiceId: null },
    }),
    prisma.customer.findUniqueOrThrow({ where: { id: customerId } }),
  ])

  if (entries.length === 0) throw new Error("No valid entries selected")

  const basicAmount = entries.reduce((sum, e) => sum + e.totalCost, 0)
  const invoiceDateObj = new Date(invoiceDate)
  const fy = getFinancialYear(invoiceDateObj)

  let cgst = 0, sgst = 0, igst = 0
  if (customer.taxType === "INTRASTATE") {
    cgst = parseFloat((basicAmount * cgstPercent / 100).toFixed(2))
    sgst = parseFloat((basicAmount * sgstPercent / 100).toFixed(2))
  } else if (customer.taxType === "INTERSTATE") {
    igst = parseFloat((basicAmount * igstPercent / 100).toFixed(2))
  }
  const totalAmount = parseFloat((basicAmount + cgst + sgst + igst).toFixed(2))

  const count = await prisma.invoice.count({ where: { financialYear: fy } })
  const invoiceNumber = String(count + 1).padStart(3, "0")

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      financialYear: fy,
      invoiceDate: invoiceDateObj,
      customerId,
      basicAmount,
      cgst,
      sgst,
      igst,
      totalAmount,
    },
  })

  await prisma.productionEntry.updateMany({
    where: { id: { in: productionEntryIds } },
    data: { invoiceId: invoice.id },
  })

  revalidatePath("/admin/production")
  revalidatePath("/admin/invoices")
  revalidatePath("/admin/dcs")
  return invoice
}

export async function recordPayment(data: {
  customerId: string
  amount: number
  paymentDate: string
  reference?: string
  notes?: string
  allocations: { invoiceId: string; amount: number }[]
}) {
  const { customerId, amount, paymentDate, reference, notes, allocations } = data

  await prisma.payment.create({
    data: {
      customerId,
      amount,
      paymentDate: new Date(paymentDate),
      reference: reference || null,
      notes: notes || null,
      allocations: {
        create: allocations.map((a) => ({
          invoiceId: a.invoiceId,
          amount: a.amount,
        })),
      },
    },
  })

  revalidatePath("/admin/invoices")
  for (const a of allocations) {
    revalidatePath(`/admin/invoices/${a.invoiceId}`)
  }
}

export async function getInvoiceWithPayments(id: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id },
    include: {
      customer: true,
      lineItems: {
        orderBy: { chromePlatingDate: "asc" },
        include: { dc: { select: { dcNumber: true, financialYear: true } } },
      },
      payments: {
        include: {
          payment: true,
        },
        orderBy: { payment: { paymentDate: "asc" } },
      },
    },
  })

  const paid = invoice.payments.reduce((sum, a) => sum + a.amount, 0)
  const balance = parseFloat((invoice.totalAmount - paid).toFixed(2))
  const status: "UNPAID" | "PARTIAL" | "PAID" =
    Math.round(paid) === 0 ? "UNPAID" : Math.round(balance) <= 0 ? "PAID" : "PARTIAL"

  return { ...invoice, paid, balance, status }
}

export async function getInvoicesByMonth(year: number, month: number) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  const invoices = await prisma.invoice.findMany({
    where: { invoiceDate: { gte: start, lte: end } },
    include: {
      customer: true,
      _count: { select: { lineItems: true } },
      payments: true,
    },
    orderBy: { createdAt: "asc" },
  })

  return invoices.map((inv) => {
    const paid = inv.payments.reduce((sum, a) => sum + a.amount, 0)
    const balance = parseFloat((inv.totalAmount - paid).toFixed(2))
    const status: "UNPAID" | "PARTIAL" | "PAID" =
      Math.round(paid) === 0 ? "UNPAID" : Math.round(balance) <= 0 ? "PAID" : "PARTIAL"
    return { ...inv, qty: inv._count.lineItems, paid, balance, status }
  })
}

export async function getNextInvoiceNumber(date: string): Promise<string> {
  const fy = getFinancialYear(new Date(date))
  const count = await prisma.invoice.count({ where: { financialYear: fy } })
  return `${String(count + 1).padStart(3, "0")}/${fy}`
}

export async function getInvoicesByDateRange(from: string, to: string) {
  const start = new Date(from)
  const end = new Date(to)
  end.setHours(23, 59, 59, 999)

  const invoices = await prisma.invoice.findMany({
    where: { invoiceDate: { gte: start, lte: end } },
    include: {
      customer: true,
      _count: { select: { lineItems: true } },
      payments: true,
    },
    orderBy: { invoiceDate: "asc" },
  })

  return invoices.map((inv) => {
    const paid = inv.payments.reduce((sum, a) => sum + a.amount, 0)
    const balance = parseFloat((inv.totalAmount - paid).toFixed(2))
    const status: "UNPAID" | "PARTIAL" | "PAID" =
      Math.round(paid) === 0 ? "UNPAID" : Math.round(balance) <= 0 ? "PAID" : "PARTIAL"
    return { ...inv, qty: inv._count.lineItems, paid, balance, status }
  })
}

export async function getOutstandingByCustomer() {
  const invoices = await prisma.invoice.findMany({
    include: { customer: true, payments: true },
    orderBy: { createdAt: "asc" },
  })

  const map = new Map<string, { customerId: string; name: string; totalBilled: number; totalPaid: number; balance: number }>()

  for (const inv of invoices) {
    const paid = inv.payments.reduce((sum, a) => sum + a.amount, 0)
    const balance = parseFloat((inv.totalAmount - paid).toFixed(2))
    if (!map.has(inv.customerId)) {
      map.set(inv.customerId, { customerId: inv.customerId, name: inv.customer.name, totalBilled: 0, totalPaid: 0, balance: 0 })
    }
    const entry = map.get(inv.customerId)!
    entry.totalBilled += inv.totalAmount
    entry.totalPaid += paid
    entry.balance += balance
  }

  return Array.from(map.values())
    .map((e) => ({ ...e, balance: parseFloat(e.balance.toFixed(2)) }))
    .filter((e) => Math.round(e.balance) > 0)
    .sort((a, b) => b.balance - a.balance)
}

export async function getPaymentsTotalByFY(fy: string, customerId?: string): Promise<number> {
  const startYear = parseInt(fy.split("-")[0])
  const start = new Date(startYear, 3, 1)
  const end = new Date(startYear + 1, 2, 31, 23, 59, 59, 999)
  const result = await prisma.payment.aggregate({
    where: {
      paymentDate: { gte: start, lte: end },
      ...(customerId ? { customerId } : {}),
    },
    _sum: { amount: true },
  })
  return result._sum.amount ?? 0
}

export async function getOutstandingInvoices(customerId?: string) {
  const invoices = await prisma.invoice.findMany({
    where: customerId ? { customerId } : {},
    include: {
      customer: true,
      payments: true,
    },
    orderBy: { createdAt: "asc" },
  })

  return invoices
    .map((inv) => {
      const paid = inv.payments.reduce((sum, a) => sum + a.amount, 0)
      const balance = parseFloat((inv.totalAmount - paid).toFixed(2))
      const status: "UNPAID" | "PARTIAL" | "PAID" =
        Math.round(paid) === 0 ? "UNPAID" : Math.round(balance) <= 0 ? "PAID" : "PARTIAL"
      return { ...inv, paid, balance, status }
    })
    .filter((inv) => Math.round(inv.balance) > 0)
}

export async function deleteInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lineItems: { select: { id: true } },
      payments: { select: { id: true } },
    },
  })
  if (!invoice) throw new Error("Invoice not found")

  await prisma.$transaction([
    // Unlink all production entries from this invoice
    prisma.productionEntry.updateMany({
      where: { invoiceId: id },
      data: { invoiceId: null },
    }),
    // Remove payment allocations pointing to this invoice
    prisma.paymentAllocation.deleteMany({ where: { invoiceId: id } }),
    // Delete the invoice
    prisma.invoice.delete({ where: { id } }),
  ])

  revalidatePath("/admin/invoices")
  revalidatePath("/admin/production")
}

export async function updateInvoice(id: string, data: { invoiceDate: string; remarks?: string }) {
  const newDate = new Date(data.invoiceDate)
  const newFY = getFinancialYear(newDate)

  const existing = await prisma.invoice.findUnique({ where: { id }, select: { financialYear: true } })
  if (!existing) throw new Error("Invoice not found")
  if (existing.financialYear !== newFY) throw new Error("Cannot change the date to a different financial year")

  await prisma.invoice.update({
    where: { id },
    data: {
      invoiceDate: newDate,
      remarks: data.remarks?.trim() || null,
    },
  })
  revalidatePath(`/admin/invoices/${id}`)
  revalidatePath("/admin/invoices")
}

export async function saveInvoicePrintParams(id: string, params: {
  poNo?: string
  vehicleNo?: string
  hsn?: string
  reverseCharge?: string
}) {
  await prisma.invoice.update({
    where: { id },
    data: {
      lastPoNo: params.poNo || null,
      lastVehicleNo: params.vehicleNo || null,
      lastHsn: params.hsn || null,
      lastReverseCharge: params.reverseCharge || null,
    },
  })
}

export async function getPaymentsByMonth(year: number, month: number) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  return prisma.payment.findMany({
    where: { paymentDate: { gte: start, lte: end } },
    include: {
      customer: { select: { id: true, name: true } },
      allocations: {
        select: {
          amount: true,
          invoice: { select: { invoiceNumber: true, financialYear: true } },
        },
      },
    },
    orderBy: { paymentDate: "asc" },
  })
}

export async function getPaymentsByDateRange(from: string, to: string) {
  const start = new Date(from)
  const end = new Date(to)
  end.setHours(23, 59, 59, 999)

  return prisma.payment.findMany({
    where: { paymentDate: { gte: start, lte: end } },
    include: {
      customer: { select: { id: true, name: true } },
      allocations: {
        select: {
          amount: true,
          invoice: { select: { invoiceNumber: true, financialYear: true } },
        },
      },
    },
    orderBy: { paymentDate: "asc" },
  })
}

export async function getPaymentById(id: string) {
  return prisma.payment.findUniqueOrThrow({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
      allocations: {
        include: {
          invoice: {
            select: { id: true, invoiceNumber: true, financialYear: true, invoiceDate: true, totalAmount: true },
          },
        },
        orderBy: { invoice: { invoiceDate: "asc" } },
      },
    },
  })
}

export async function getOutstandingInvoicesForEdit(customerId: string, paymentId: string) {
  const [existingAllocs, invoices] = await Promise.all([
    prisma.paymentAllocation.findMany({
      where: { paymentId },
      select: { invoiceId: true, amount: true },
    }),
    prisma.invoice.findMany({
      where: { customerId },
      include: { payments: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const existingAllocMap = new Map(existingAllocs.map((a) => [a.invoiceId, a.amount]))

  return invoices
    .map((inv) => {
      const paid = inv.payments.reduce((s, a) => s + a.amount, 0)
      const balance = inv.totalAmount - paid
      const currentAlloc = existingAllocMap.get(inv.id) ?? 0
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        financialYear: inv.financialYear,
        invoiceDate: inv.invoiceDate,
        totalAmount: inv.totalAmount,
        balance: Math.round(balance + currentAlloc),
        currentAlloc: Math.round(currentAlloc),
      }
    })
    .filter((inv) => inv.balance > 0)
}

export async function updatePayment(
  id: string,
  data: {
    paymentDate: string
    reference?: string
    notes?: string
    amount: number
    allocations: { invoiceId: string; amount: number }[]
  }
) {
  const oldAllocs = await prisma.paymentAllocation.findMany({
    where: { paymentId: id },
    select: { invoiceId: true },
  })

  await prisma.$transaction(async (tx) => {
    await tx.paymentAllocation.deleteMany({ where: { paymentId: id } })
    await tx.payment.update({
      where: { id },
      data: {
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        reference: data.reference || null,
        notes: data.notes || null,
        allocations: {
          create: data.allocations.map((a) => ({ invoiceId: a.invoiceId, amount: a.amount })),
        },
      },
    })
  })

  const affectedInvoiceIds = new Set([
    ...oldAllocs.map((a) => a.invoiceId),
    ...data.allocations.map((a) => a.invoiceId),
  ])

  revalidatePath("/admin/payments")
  revalidatePath(`/admin/payments/${id}`)
  revalidatePath("/admin/invoices")
  for (const invoiceId of affectedInvoiceIds) {
    revalidatePath(`/admin/invoices/${invoiceId}`)
  }
}

export async function deletePayment(id: string) {
  const allocs = await prisma.paymentAllocation.findMany({
    where: { paymentId: id },
    select: { invoiceId: true },
  })

  await prisma.payment.delete({ where: { id } })

  revalidatePath("/admin/payments")
  revalidatePath("/admin/invoices")
  for (const a of allocs) {
    revalidatePath(`/admin/invoices/${a.invoiceId}`)
  }
}

export async function getCustomerLedger(customerId: string) {
  const [invoices, unbilledEntries] = await Promise.all([
    prisma.invoice.findMany({
      where: { customerId },
      include: { payments: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.productionEntry.findMany({
      where: { customerId, invoiceId: null, status: { not: "FAILED" } },
      select: { totalCost: true },
    }),
  ])

  const totalBilled = invoices.reduce((s, inv) => s + inv.totalAmount, 0)
  const totalPaid = invoices.reduce(
    (s, inv) => s + inv.payments.reduce((ps, a) => ps + a.amount, 0),
    0
  )
  const receivables = parseFloat((totalBilled - totalPaid).toFixed(2))
  const unbilled = parseFloat(
    unbilledEntries.reduce((s, e) => s + e.totalCost, 0).toFixed(2)
  )

  return { totalBilled, totalPaid, receivables, unbilled, totalExposure: receivables + unbilled }
}
