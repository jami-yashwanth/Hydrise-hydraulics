import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { updateCustomer } from "@/lib/actions/customers"
import { CustomerForm } from "@/components/admin/customer-form"

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await prisma.customer.findUnique({ where: { id } })
  if (!customer) notFound()

  const action = updateCustomer.bind(null, customer.id)

  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Edit Customer</h1>
      <CustomerForm action={action} defaultValues={customer} />
    </div>
  )
}
