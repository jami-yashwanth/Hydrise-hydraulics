"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Wallet, AlertCircle } from "lucide-react"
import { format } from "date-fns"

export type InvoiceRow = {
  id: string
  invoiceNumber: string
  financialYear: string
  invoiceDate: string
  customerName: string
  totalAmount: number
  paid: number
  balance: number
  status: "PAID" | "PARTIAL" | "UNPAID"
}

export type UnbilledCustomerRow = {
  customerId: string
  customerName: string
  count: number
  total: number
}

interface Props {
  monthBilled: number
  monthInvoiceCount: number
  receivables: number
  unbilled: number
  monthInvoices: InvoiceRow[]
  outstandingInvoices: InvoiceRow[]
  unbilledByCustomer: UnbilledCustomerRow[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n)

const statusVariant: Record<InvoiceRow["status"], "default" | "secondary" | "destructive"> = {
  PAID: "default",
  PARTIAL: "secondary",
  UNPAID: "destructive",
}

function InvoiceList({ invoices }: { invoices: InvoiceRow[] }) {
  if (invoices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">No invoices found.</p>
    )
  }
  return (
    <div className="divide-y">
      {invoices.map((inv) => (
        <div key={inv.id} className="py-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">
              #{inv.invoiceNumber}/{inv.financialYear}
            </span>
            <Badge variant={statusVariant[inv.status]}>{inv.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{inv.customerName}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(inv.invoiceDate), "d MMM yyyy")}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span>{fmt(inv.totalAmount)}</span>
            {inv.balance > 0 && (
              <span className="text-destructive text-xs">Due: {fmt(inv.balance)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export function FinancialCards({
  monthBilled,
  monthInvoiceCount,
  receivables,
  unbilled,
  monthInvoices,
  outstandingInvoices,
  unbilledByCustomer,
}: Props) {
  return (
    <div>
      <h2 className="text-sm font-medium text-muted-foreground mb-3">Financials</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Sheet>
          <SheetTrigger asChild>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Invoiced This Month
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmt(monthBilled)}</p>
                <p className="text-xs text-muted-foreground">
                  {monthInvoiceCount} invoice{monthInvoiceCount !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Invoices This Month</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 overflow-y-auto px-4 pb-4">
              <InvoiceList invoices={monthInvoices} />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Outstanding Receivables
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmt(receivables)}</p>
                <p className="text-xs text-muted-foreground">Across all invoices</p>
              </CardContent>
            </Card>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Outstanding Receivables</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 overflow-y-auto px-4 pb-4">
              <InvoiceList invoices={outstandingInvoices} />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unbilled Amount
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmt(unbilled)}</p>
                <p className="text-xs text-muted-foreground">Not yet invoiced</p>
              </CardContent>
            </Card>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Unbilled Entries by Customer</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 overflow-y-auto px-4 pb-4">
              {unbilledByCustomer.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  No unbilled entries.
                </p>
              ) : (
                <div className="divide-y">
                  {unbilledByCustomer.map((c) => (
                    <div key={c.customerId} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{c.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.count} entr{c.count !== 1 ? "ies" : "y"}
                        </p>
                      </div>
                      <span className="text-sm font-medium">{fmt(c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
