import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getInvoicesByDateRange, getOutstandingInvoices } from "@/lib/actions/invoices"
import { COMPANY_CONFIG as COMPANY } from "@/lib/config"
import { format } from "date-fns"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const logoBase64 = (() => {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"))
    return `data:image/png;base64,${buf.toString("base64")}`
  } catch {
    return ""
  }
})()

function fmtRs(n: number): string {
  const s = String(Math.round(n))
  if (s.length <= 3) return s
  const last3 = s.slice(-3)
  const rest = s.slice(0, -3)
  const parts: string[] = [last3]
  for (let i = rest.length; i > 0; i -= 2) parts.unshift(rest.slice(Math.max(0, i - 2), i))
  return parts.join(",")
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const url = new URL(request.url)
  const from = url.searchParams.get("from") ?? ""
  const to = url.searchParams.get("to") ?? ""
  const customerFilter = url.searchParams.get("customer") ?? ""
  const statusFilter = url.searchParams.get("status") ?? ""

  if (!from || !to) return new NextResponse("Missing date range", { status: 400 })

  const allInvoices = await getInvoicesByDateRange(from, to)

  const invoices = allInvoices.filter((inv) => {
    if (customerFilter && inv.customerId !== customerFilter) return false
    if (statusFilter && inv.status !== statusFilter) return false
    return true
  })

  const outstandingAll = await getOutstandingInvoices(customerFilter || undefined)

  const fromLabel = format(new Date(from), "dd MMM yyyy")
  const toLabel = format(new Date(to), "dd MMM yyyy")

  const showCgstSgst = invoices.some((i) => i.cgst > 0 || i.sgst > 0)
  const showIgst = invoices.some((i) => i.igst > 0)

  const totalBasic = invoices.reduce((s, i) => s + i.basicAmount, 0)
  const totalCgst = invoices.reduce((s, i) => s + i.cgst, 0)
  const totalSgst = invoices.reduce((s, i) => s + i.sgst, 0)
  const totalIgst = invoices.reduce((s, i) => s + i.igst, 0)
  const totalAmount = invoices.reduce((s, i) => s + i.totalAmount, 0)
  const totalPaid = invoices.reduce((s, i) => s + i.paid, 0)
  const totalBalance = invoices.reduce((s, i) => s + i.balance, 0)

  // ── Consolidated invoice rows ───────────────────────────────────────────────
  const taxColHeaders = [
    ...(showCgstSgst ? ["<th>CGST</th><th>SGST</th>"] : []),
    ...(showIgst ? ["<th>IGST</th>"] : []),
  ].join("")

  const invoiceRows = invoices
    .map(
      (inv, i) => `
    <tr class="${i % 2 === 1 ? "alt" : ""}">
      <td class="center">${i + 1}</td>
      <td class="mono">${inv.invoiceNumber}/${inv.financialYear}</td>
      <td class="center">${format(new Date(inv.invoiceDate), "dd.MM.yyyy")}</td>
      <td>${inv.customer.name}</td>
      <td class="center">${inv.qty}</td>
      <td class="right">${fmtRs(inv.basicAmount)}</td>
      ${showCgstSgst ? `<td class="right dim">${inv.cgst > 0 ? fmtRs(inv.cgst) : "—"}</td><td class="right dim">${inv.sgst > 0 ? fmtRs(inv.sgst) : "—"}</td>` : ""}
      ${showIgst ? `<td class="right dim">${inv.igst > 0 ? fmtRs(inv.igst) : "—"}</td>` : ""}
      <td class="right bold">${fmtRs(inv.totalAmount)}</td>
      <td class="center"><span class="badge badge-${inv.status.toLowerCase()}">${inv.status}</span></td>
      <td class="right green">${inv.paid > 0 ? fmtRs(inv.paid) : "—"}</td>
      <td class="right ${inv.balance > 0 ? "red" : "dim"}">${inv.balance > 0 ? fmtRs(inv.balance) : "—"}</td>
    </tr>`
    )
    .join("")

  const consolidatedTotalsRow = `
    <tr class="totals-row">
      <td colspan="5"></td>
      <td class="right">${fmtRs(totalBasic)}</td>
      ${showCgstSgst ? `<td class="right">${fmtRs(totalCgst)}</td><td class="right">${fmtRs(totalSgst)}</td>` : ""}
      ${showIgst ? `<td class="right">${fmtRs(totalIgst)}</td>` : ""}
      <td class="right">${fmtRs(totalAmount)}</td>
      <td></td>
      <td class="right green">${fmtRs(totalPaid)}</td>
      <td class="right red">${totalBalance > 0 ? fmtRs(totalBalance) : "—"}</td>
    </tr>`

  // ── Customer-wise breakdown (only when showing all customers) ───────────────
  let customerWiseSection = ""
  if (!customerFilter && invoices.length > 0) {
    const custMap = new Map<string, { name: string; invoices: typeof invoices }>()
    for (const inv of invoices) {
      if (!custMap.has(inv.customerId)) custMap.set(inv.customerId, { name: inv.customer.name, invoices: [] })
      custMap.get(inv.customerId)!.invoices.push(inv)
    }

    const customerBlocks = Array.from(custMap.values())
      .map(({ name, invoices: cinvs }) => {
        const cTotal = cinvs.reduce((s, i) => s + i.totalAmount, 0)
        const cPaid = cinvs.reduce((s, i) => s + i.paid, 0)
        const cBalance = cinvs.reduce((s, i) => s + i.balance, 0)
        const showCG = cinvs.some((i) => i.cgst > 0 || i.sgst > 0)
        const showIG = cinvs.some((i) => i.igst > 0)

        const rows = cinvs
          .map(
            (inv, i) => `
          <tr class="${i % 2 === 1 ? "alt" : ""}">
            <td class="center">${i + 1}</td>
            <td class="mono">${inv.invoiceNumber}/${inv.financialYear}</td>
            <td class="center">${format(new Date(inv.invoiceDate), "dd.MM.yyyy")}</td>
            <td class="center">${inv.qty}</td>
            <td class="right">${fmtRs(inv.basicAmount)}</td>
            ${showCG ? `<td class="right dim">${inv.cgst > 0 ? fmtRs(inv.cgst) : "—"}</td><td class="right dim">${inv.sgst > 0 ? fmtRs(inv.sgst) : "—"}</td>` : ""}
            ${showIG ? `<td class="right dim">${inv.igst > 0 ? fmtRs(inv.igst) : "—"}</td>` : ""}
            <td class="right bold">${fmtRs(inv.totalAmount)}</td>
            <td class="center"><span class="badge badge-${inv.status.toLowerCase()}">${inv.status}</span></td>
            <td class="right green">${inv.paid > 0 ? fmtRs(inv.paid) : "—"}</td>
            <td class="right ${inv.balance > 0 ? "red" : "dim"}">${inv.balance > 0 ? fmtRs(inv.balance) : "—"}</td>
          </tr>`
          )
          .join("")

        return `
        <div class="cust-block">
          <div class="cust-header">${name}</div>
          <table class="items">
            <thead>
              <tr>
                <th style="width:26px;">Sl.</th>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Qty</th>
                <th>Basic (₹)</th>
                ${showCG ? "<th>CGST</th><th>SGST</th>" : ""}
                ${showIG ? "<th>IGST</th>" : ""}
                <th>Total (₹)</th>
                <th>Status</th>
                <th>Received (₹)</th>
                <th>Balance (₹)</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr class="totals-row">
                <td colspan="4"></td>
                <td class="right">${fmtRs(cinvs.reduce((s, i) => s + i.basicAmount, 0))}</td>
                ${showCG ? `<td class="right">${fmtRs(cinvs.reduce((s, i) => s + i.cgst, 0))}</td><td class="right">${fmtRs(cinvs.reduce((s, i) => s + i.sgst, 0))}</td>` : ""}
                ${showIG ? `<td class="right">${fmtRs(cinvs.reduce((s, i) => s + i.igst, 0))}</td>` : ""}
                <td class="right">${fmtRs(cTotal)}</td>
                <td></td>
                <td class="right green">${fmtRs(cPaid)}</td>
                <td class="right ${cBalance > 0 ? "red" : "dim"}">${cBalance > 0 ? fmtRs(cBalance) : "—"}</td>
              </tr>
            </tfoot>
          </table>
        </div>`
      })
      .join("")

    customerWiseSection = `
      <div class="section page-break">
        <div class="section-header">
          <div class="section-title">Customer-wise Breakdown</div>
          <div class="section-sub">${fromLabel} — ${toLabel}</div>
        </div>
        ${customerBlocks}
      </div>`
  }

  // ── Outstanding section ─────────────────────────────────────────────────────
  let outstandingSection = ""
  if (outstandingAll.length > 0) {
    const outMap = new Map<string, { name: string; invoices: typeof outstandingAll }>()
    for (const inv of outstandingAll) {
      if (!outMap.has(inv.customerId)) outMap.set(inv.customerId, { name: inv.customer.name, invoices: [] })
      outMap.get(inv.customerId)!.invoices.push(inv)
    }

    const totalOutstanding = outstandingAll.reduce((s, i) => s + i.balance, 0)

    const outBlocks = Array.from(outMap.values())
      .map(({ name, invoices: oinvs }) => {
        const custBalance = oinvs.reduce((s, i) => s + i.balance, 0)
        const rows = oinvs
          .map(
            (inv, i) => `
          <tr class="${i % 2 === 1 ? "alt" : ""}">
            <td class="mono">${inv.invoiceNumber}/${inv.financialYear}</td>
            <td class="center">${format(new Date(inv.invoiceDate), "dd.MM.yyyy")}</td>
            <td class="right">${fmtRs(inv.totalAmount)}</td>
            <td class="right green">${inv.paid > 0 ? fmtRs(inv.paid) : "—"}</td>
            <td class="right red bold">${fmtRs(inv.balance)}</td>
            <td class="center"><span class="badge badge-${inv.status.toLowerCase()}">${inv.status}</span></td>
          </tr>`
          )
          .join("")

        return `
        <div class="cust-block">
          <div class="cust-header out-header">
            <span>${name}</span>
            <span class="red">Outstanding: ₹${fmtRs(custBalance)}</span>
          </div>
          <table class="items">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Total (₹)</th>
                <th>Received (₹)</th>
                <th>Balance (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr class="totals-row">
                <td colspan="2"></td>
                <td class="right">${fmtRs(oinvs.reduce((s, i) => s + i.totalAmount, 0))}</td>
                <td class="right green">${fmtRs(oinvs.reduce((s, i) => s + i.paid, 0))}</td>
                <td class="right red">${fmtRs(custBalance)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>`
      })
      .join("")

    outstandingSection = `
      <div class="section page-break">
        <div class="section-header">
          <div>
            <div class="section-title">Outstanding — All Time</div>
            <div class="section-sub">Uncleared bills as of ${format(new Date(), "dd MMM yyyy")}</div>
          </div>
          <div class="text-right">
            <div class="section-sub">Total Outstanding</div>
            <div class="section-outstanding-total">₹${fmtRs(totalOutstanding)}</div>
          </div>
        </div>
        ${outBlocks}
      </div>`
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice Report — ${fromLabel} to ${toLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; background: #d0d0d0; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    .page {
      width: 210mm;
      margin: 10mm auto;
      background: #fff;
      padding: 12mm;
    }

    @media print {
      body { background: #fff; }
      .page { margin: 0; padding: 0; width: 100%; }
      @page { size: A4; margin: 12mm; }
      .page-break { page-break-before: always; }
    }

    /* ── Header ── */
    .doc-header {
      display: flex;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 2px solid #1e3558;
      margin-bottom: 14px;
    }
    .doc-logo { flex: 0 0 auto; margin-right: 12px; }
    .doc-logo img { width: 64px; height: 64px; object-fit: contain; display: block; }
    .doc-co { flex: 1; }
    .doc-co-name { font-size: 20px; font-weight: 900; font-style: italic; color: #1e3558; letter-spacing: 0.3px; }
    .doc-co-line { font-size: 9.5px; color: #444; margin-top: 2px; }
    .doc-report { text-align: right; }
    .doc-report-title { font-size: 16px; font-weight: 900; color: #1e3558; letter-spacing: 1px; text-transform: uppercase; }
    .doc-report-meta { font-size: 10px; color: #555; margin-top: 3px; }

    /* ── Section ── */
    .section { margin-bottom: 20px; }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      background: #1e3558;
      color: #fff;
      padding: 6px 10px;
      margin-bottom: 6px;
      border-radius: 2px;
    }
    .section-title { font-size: 12px; font-weight: bold; letter-spacing: 0.5px; }
    .section-sub { font-size: 9.5px; opacity: 0.85; margin-top: 1px; }
    .section-outstanding-total { font-size: 14px; font-weight: bold; color: #ffb3b3; }
    .text-right { text-align: right; }

    /* ── Customer block ── */
    .cust-block { margin-bottom: 14px; }
    .cust-header {
      background: #eef1f7;
      color: #1e3558;
      font-weight: bold;
      font-size: 10.5px;
      padding: 4px 8px;
      border: 1px solid #b0b8c8;
      border-bottom: none;
    }
    .out-header { display: flex; justify-content: space-between; }

    /* ── Items table ── */
    table.items { border-collapse: collapse; width: 100%; font-size: 10px; }
    table.items th, table.items td { border: 1px solid #b0b8c8; padding: 3px 6px; }
    table.items thead tr { background: #eef1f7; color: #1e3558; font-size: 9.5px; font-weight: bold; }
    table.items thead th { text-align: center; }
    table.items tr.alt { background: #f8f9fc; }
    .totals-row { background: #eef1f7 !important; font-weight: bold; font-size: 10px; }

    .center { text-align: center; }
    .right  { text-align: right; }
    .bold   { font-weight: bold; }
    .dim    { color: #888; }
    .green  { color: #166534; }
    .red    { color: #b91c1c; }
    .mono   { font-family: monospace; color: #1e3558; font-weight: 600; }

    /* ── Status badges ── */
    .badge { display: inline-block; padding: 1px 6px; border-radius: 9px; font-size: 9px; font-weight: bold; }
    .badge-paid    { background: #dcfce7; color: #166534; }
    .badge-partial { background: #fef9c3; color: #854d0e; }
    .badge-unpaid  { background: #fee2e2; color: #b91c1c; }

    /* ── Summary cards ── */
    .summary-cards {
      display: flex;
      gap: 10px;
      margin-top: 10px;
      margin-bottom: 6px;
    }
    .summary-card {
      flex: 1;
      border: 1px solid #b0b8c8;
      border-radius: 4px;
      padding: 6px 10px;
      background: #fafbfd;
      text-align: center;
    }
    .summary-card-label { font-size: 9px; color: #666; }
    .summary-card-value { font-size: 13px; font-weight: bold; color: #1e3558; margin-top: 2px; }
    .summary-card-value.green { color: #166534; }
    .summary-card-value.red   { color: #b91c1c; }

    /* ── Footer ── */
    .doc-footer {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #b0b8c8;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #888;
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Document Header -->
  <div class="doc-header">
    <div class="doc-logo">${logoBase64 ? `<img src="${logoBase64}" alt="Logo">` : ""}</div>
    <div class="doc-co">
      <div class="doc-co-name">${COMPANY.name}</div>
      <div class="doc-co-line">${COMPANY.tagline1}</div>
      <div class="doc-co-line">${COMPANY.address}</div>
      <div class="doc-co-line">GSTIN: ${COMPANY.gstin} &nbsp;|&nbsp; ${COMPANY.phone}</div>
    </div>
    <div class="doc-report">
      <div class="doc-report-title">Invoice Report</div>
      <div class="doc-report-meta">${fromLabel} — ${toLabel}</div>
      ${statusFilter ? `<div class="doc-report-meta">Status: ${statusFilter}</div>` : ""}
    </div>
  </div>

  <!-- Section 1: Consolidated Invoice List -->
  <div class="section">
    <div class="section-header">
      <div>
        <div class="section-title">Consolidated Invoice List</div>
        <div class="section-sub">${fromLabel} — ${toLabel}</div>
      </div>
      <div class="text-right">
        <div class="section-sub">${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}</div>
      </div>
    </div>

    ${
      invoices.length === 0
        ? `<p style="text-align:center; padding:20px; color:#888; font-size:11px;">No invoices found for this period.</p>`
        : `
    <table class="items">
      <thead>
        <tr>
          <th style="width:26px;">Sl.</th>
          <th>Invoice No.</th>
          <th>Date</th>
          <th>Customer</th>
          <th>Qty</th>
          <th>Basic (₹)</th>
          ${showCgstSgst ? "<th>CGST</th><th>SGST</th>" : ""}
          ${showIgst ? "<th>IGST</th>" : ""}
          <th>Total (₹)</th>
          <th>Status</th>
          <th>Received (₹)</th>
          <th>Balance (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${invoiceRows}
      </tbody>
      <tfoot>
        ${consolidatedTotalsRow}
      </tfoot>
    </table>

    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-card-label">Total Invoiced</div>
        <div class="summary-card-value">₹${fmtRs(totalAmount)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-card-label">Total Received</div>
        <div class="summary-card-value green">₹${fmtRs(totalPaid)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-card-label">Balance (this period)</div>
        <div class="summary-card-value red">₹${fmtRs(totalBalance)}</div>
      </div>
    </div>`
    }
  </div>

  <!-- Section 2: Customer-wise Breakdown -->
  ${customerWiseSection}

  <!-- Section 3: Outstanding -->
  ${outstandingSection}

  <div class="doc-footer">
    <span>Generated on ${format(new Date(), "dd MMM yyyy")}</span>
    <span>${COMPANY.name} — Confidential</span>
  </div>

</div>
<script>window.onload = function () { window.print(); }</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
