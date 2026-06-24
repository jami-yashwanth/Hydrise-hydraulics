import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Plus, Pencil } from "lucide-react"
import { DeleteEmployeeButton } from "@/components/admin/delete-employee-button"

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany({ orderBy: { createdAt: "asc" } })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <Button asChild size="sm">
          <Link href="/admin/employees/new">
            <Plus className="h-4 w-4 mr-1" /> Add Employee
          </Link>
        </Button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        {employees.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No employees yet. Add your first employee.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Designation</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {employees.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.designation ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <Link href={`/admin/employees/${e.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <DeleteEmployeeButton id={e.id} name={e.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
