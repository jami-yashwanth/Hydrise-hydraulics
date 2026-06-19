import { createCustomer } from "@/lib/actions/customers"
import { CustomerForm } from "@/components/admin/customer-form"

export default function NewCustomerPage() {
  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Add Customer</h1>
      <CustomerForm action={createCustomer} />
    </div>
  )
}
