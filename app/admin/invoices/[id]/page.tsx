import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import { getInvoiceWithPayments } from "@/lib/actions/invoices"
import { DownloadInvoiceDialog } from "@/components/admin/download-invoice-dialog"

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-IN")
}

function StatusChip({ status }: { status: "UNPAID" | "PARTIAL" | "PAID" }) {
  const cls =
    status === "PAID"
      ? "bg-green-100 text-green-800"
      : status === "PARTIAL"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-700"
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  )
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let invoice
  try {
    invoice = await getInvoiceWithPayments(id)
  } catch {
    notFound()
  }

  const isIntrastate = invoice.cgst > 0 || invoice.sgst > 0
  const isInterstate = invoice.igst > 0

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Back */}
      <Link href="/admin/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Invoices
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Invoice #{invoice.invoiceNumber}/{invoice.financialYear}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {invoice.customer.name} &middot; {format(new Date(invoice.invoiceDate), "dd MMMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DownloadInvoiceDialog
            invoiceId={id}
            initialValues={{
              poNo: invoice.lastPoNo,
              vehicleNo: invoice.lastVehicleNo,
              hsn: invoice.lastHsn,
              reverseCharge: invoice.lastReverseCharge,
            }}
          />
          <StatusChip status={invoice.status} />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Total Amount</p>
          <p className="text-xl font-semibold mt-1">₹{fmt(invoice.totalAmount)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Received</p>
          <p className="text-xl font-semibold mt-1 text-green-700">₹{fmt(invoice.paid)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Balance Due</p>
          <p className={`text-xl font-semibold mt-1 ${invoice.balance > 0 ? "text-red-600" : "text-muted-foreground"}`}>
            ₹{fmt(invoice.balance)}
          </p>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-medium text-sm">Line Items ({invoice.lineItems.length} Nos.)</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Date</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Customer DC</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Hydrise DC</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Qty</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Dia (mm)</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Length (mm)</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoice.lineItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2.5 text-center">{format(new Date(item.chromePlatingDate), "dd.MM.yyyy")}</td>
                <td className="px-4 py-2.5 text-center text-muted-foreground">{item.customerDcNo ?? "—"}</td>
                <td className="px-4 py-2.5 text-center text-muted-foreground">
                  {item.dc ? `#${item.dc.dcNumber}` : "—"}
                </td>
                <td className="px-4 py-2.5 text-center font-medium">{item.quantity}</td>
                <td className="px-4 py-2.5 text-center">{item.rodDiaMm}</td>
                <td className="px-4 py-2.5 text-center">{item.rodLengthMm}</td>
                <td className="px-4 py-2.5 text-center font-medium">₹{fmt(item.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tax breakdown */}
        <div className="border-t px-4 py-3 space-y-1.5 text-sm bg-gray-50">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Basic Amount</span>
            <span>₹{fmt(invoice.basicAmount)}</span>
          </div>
          {isIntrastate && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CGST ({invoice.basicAmount > 0 ? (invoice.cgst / invoice.basicAmount * 100).toFixed(2).replace(/\.?0+$/, "") : 0}%)</span>
                <span>₹{fmt(invoice.cgst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SGST ({invoice.basicAmount > 0 ? (invoice.sgst / invoice.basicAmount * 100).toFixed(2).replace(/\.?0+$/, "") : 0}%)</span>
                <span>₹{fmt(invoice.sgst)}</span>
              </div>
            </>
          )}
          {isInterstate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">IGST ({invoice.basicAmount > 0 ? (invoice.igst / invoice.basicAmount * 100).toFixed(2).replace(/\.?0+$/, "") : 0}%)</span>
              <span>₹{fmt(invoice.igst)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base border-t pt-2">
            <span>Total Amount</span>
            <span>₹{fmt(invoice.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-medium text-sm">Payment History</h2>
        </div>
        {invoice.payments.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No payments recorded yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Reference</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoice.payments.map((alloc) => (
                <tr key={alloc.id}>
                  <td className="px-4 py-2.5">{format(new Date(alloc.payment.paymentDate), "dd.MM.yyyy")}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{alloc.payment.reference ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-green-700">₹{fmt(alloc.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t font-semibold text-sm">
              <tr>
                <td className="px-4 py-2.5" colSpan={2}>Total Received</td>
                <td className="px-4 py-2.5 text-right text-green-700">₹{fmt(invoice.paid)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

    </div>
  )
}
