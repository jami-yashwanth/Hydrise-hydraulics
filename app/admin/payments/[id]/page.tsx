import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import { getPaymentById, getOutstandingInvoicesForEdit } from "@/lib/actions/invoices"
import { EditPaymentDialog } from "@/components/admin/edit-payment-dialog"
import { DeletePaymentButton } from "@/components/admin/delete-payment-button"

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-IN")
}

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let payment
  let editableInvoices
  try {
    payment = await getPaymentById(id)
    editableInvoices = await getOutstandingInvoicesForEdit(payment.customerId, id)
  } catch {
    notFound()
  }

  const backMonth = `${new Date(payment.paymentDate).getFullYear()}-${String(new Date(payment.paymentDate).getMonth() + 1).padStart(2, "0")}`

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Back */}
      <Link
        href={`/admin/payments?month=${backMonth}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Payment History
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{payment.customer.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(payment.paymentDate), "dd MMMM yyyy")}
            {payment.reference && <> &middot; {payment.reference}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeletePaymentButton paymentId={id} />
          <EditPaymentDialog
            paymentId={id}
            initialAmount={payment.amount}
            initialPaymentDate={format(new Date(payment.paymentDate), "yyyy-MM-dd")}
            initialReference={payment.reference}
            initialNotes={payment.notes}
            editableInvoices={editableInvoices}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Amount Received</p>
          <p className="text-xl font-semibold mt-1 text-green-700">₹{fmt(payment.amount)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Invoices Covered</p>
          <p className="text-xl font-semibold mt-1">{payment.allocations.length}</p>
        </div>
      </div>

      {/* Allocations */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-medium text-sm">Invoice Allocations</h2>
        </div>
        {payment.allocations.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No allocations found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Invoice</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Invoice Date</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Invoice Total</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Allocated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payment.allocations.map((alloc) => (
                <tr key={alloc.invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/invoices/${alloc.invoice.id}`}
                      className="font-mono text-blue-600 font-medium hover:underline"
                    >
                      #{alloc.invoice.invoiceNumber}/{alloc.invoice.financialYear}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {format(new Date(alloc.invoice.invoiceDate), "dd.MM.yyyy")}
                  </td>
                  <td className="px-4 py-2.5 text-right">₹{fmt(alloc.invoice.totalAmount)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-green-700">
                    ₹{fmt(alloc.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t font-semibold text-sm">
              <tr>
                <td className="px-4 py-2.5" colSpan={3}>Total Received</td>
                <td className="px-4 py-2.5 text-right text-green-700">₹{fmt(payment.amount)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Notes */}
      {payment.notes && (
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Notes</p>
          <p className="text-sm">{payment.notes}</p>
        </div>
      )}
    </div>
  )
}
