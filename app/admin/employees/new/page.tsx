import { createEmployee } from "@/lib/actions/employees"
import { EmployeeForm } from "@/components/admin/employee-form"

export default function NewEmployeePage() {
  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Add Employee</h1>
      <EmployeeForm action={createEmployee} />
    </div>
  )
}
