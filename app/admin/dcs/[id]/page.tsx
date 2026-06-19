import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, Download } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { DownloadDCDialog } from "@/components/admin/download-dc-dialog"

export default async function DCDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const dc = await prisma.dC.findUnique({
    where: { id },
    include: {
      customer: true,
      entries: {
        orderBy: { chromePlatingDate: "asc" },
        select: {
          id: true,
          chromePlatingDate: true,
          customerDcNo: true,
          rodDiaMm: true,
          rodLengthMm: true,
          area: true,
          quantity: true,
          jobType: true,
          description: true,
          status: true,
          invoiceId: true,
          invoice: { select: { invoiceNumber: true, financialYear: true } },
        },
      },
    },
  })

  if (!dc) notFound()

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <Link href="/admin/dcs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Delivery Challans
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            DC #{dc.dcNumber} / {dc.financialYear}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dc.customer.name} · {format(new Date(dc.dcDate), "dd MMMM yyyy")}
          </p>
        </div>
        <DownloadDCDialog
          dcId={id}
          initialValues={{
            orderNo: dc.lastOrderNo,
            orderDate: dc.lastOrderDate,
            vehicleNo: dc.lastVehicleNo,
          }}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Total Items</p>
          <p className="text-xl font-semibold mt-1">{dc.entries.length} Nos.</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Invoiced</p>
          <p className="text-xl font-semibold mt-1">
            {dc.entries.filter((e) => e.invoiceId).length} / {dc.entries.length}
          </p>
        </div>
      </div>

      {/* Customer */}
      <div className="bg-white border rounded-lg p-4 text-sm space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Customer</p>
        <p className="font-semibold">{dc.customer.name}</p>
        {dc.customer.address && <p className="text-muted-foreground">{dc.customer.address}</p>}
        {dc.customer.gstin && <p className="text-muted-foreground">GSTIN: {dc.customer.gstin}</p>}
      </div>

      {/* Entries */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-medium text-sm">Entries ({dc.entries.length} Nos.)</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Sl.</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Qty</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Cust. DC</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Dia (mm)</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Length (mm)</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dc.entries.map((e, i) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-center text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-2.5 text-center">{format(new Date(e.chromePlatingDate), "dd.MM.yyyy")}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {[e.jobType, e.description].filter(Boolean).join(" — ") || "—"}
                </td>
                <td className="px-4 py-2.5 text-center font-medium">{e.quantity}</td>
                <td className="px-4 py-2.5 text-center text-muted-foreground">{e.customerDcNo ?? "—"}</td>
                <td className="px-4 py-2.5 text-center">{e.rodDiaMm}</td>
                <td className="px-4 py-2.5 text-center">{e.rodLengthMm}</td>
                <td className="px-4 py-2.5 text-center">
                  {e.invoice ? (
                    <Link
                      href={`/admin/invoices/${e.invoiceId}`}
                      className="text-xs text-blue-600 hover:underline font-mono"
                    >
                      #{e.invoice.invoiceNumber}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
