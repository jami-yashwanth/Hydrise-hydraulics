import { prisma } from "@/lib/prisma"
import { createProductionEntry } from "@/lib/actions/production"
import { ProductionForm } from "@/components/admin/production-form"

export default async function NewProductionPage() {
  const [customers, employees] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.employee.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">New Production Entry</h1>
      <ProductionForm action={createProductionEntry} customers={customers} employees={employees} />
    </div>
  )
}
