import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { updateEmployee } from "@/lib/actions/employees"
import { EmployeeForm } from "@/components/admin/employee-form"

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const employee = await prisma.employee.findUnique({ where: { id } })
  if (!employee) notFound()

  const action = updateEmployee.bind(null, employee.id)

  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Edit Employee</h1>
      <EmployeeForm action={action} defaultValues={employee} />
    </div>
  )
}
