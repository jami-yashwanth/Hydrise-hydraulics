"use client"

import { format } from "date-fns"

interface LineItem {
  id: string
  chromePlatingDate: Date
  customerDcNo: string | null
  rodDiaMm: number
  rodLengthMm: number
  quantity: number
  totalCost: number
  dcId: string | null
  dc: { dcNumber: string; financialYear: string } | null
}

interface Props {
  lineItems: LineItem[]
}

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-IN")
}

export function InvoiceLineItems({ lineItems }: Props) {
  return (
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
        {lineItems.map((item) => (
          <tr key={item.id}>
            <td className="px-4 py-2.5 text-center">{format(new Date(item.chromePlatingDate), "dd.MM.yyyy")}</td>
            <td className="px-4 py-2.5 text-center text-muted-foreground">{item.customerDcNo ?? "—"}</td>
            <td className="px-4 py-2.5 text-center">
              {item.dc ? (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  #{item.dc.dcNumber}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </td>
            <td className="px-4 py-2.5 text-center font-medium">{item.quantity}</td>
            <td className="px-4 py-2.5 text-center">{item.rodDiaMm}</td>
            <td className="px-4 py-2.5 text-center">{item.rodLengthMm}</td>
            <td className="px-4 py-2.5 text-right font-medium">₹{fmt(item.totalCost)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
