import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getInvoiceWithPayments } from "@/lib/actions/invoices"
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

function toIndianNumber(n: number): string {
  const s = String(Math.round(n))
  if (s.length <= 3) return s
  const last3 = s.slice(-3)
  const rest = s.slice(0, -3)
  const parts: string[] = [last3]
  for (let i = rest.length; i > 0; i -= 2) {
    parts.unshift(rest.slice(Math.max(0, i - 2), i))
  }
  return parts.join(",")
}

function fmtRs(n: number): string {
  return toIndianNumber(n)
}

function numberToWords(num: number): string {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ]
  const tensW = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  function tens(n: number): string {
    if (n === 0) return ""
    if (n < 20) return ones[n]
    return tensW[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "")
  }

  function hundreds(n: number): string {
    if (n === 0) return ""
    if (n < 100) return tens(n)
    const rem = n % 100
    return ones[Math.floor(n / 100)] + " Hundred" + (rem ? " " + tens(rem) : "")
  }

  if (num === 0) return "Zero Only"

  const intPart = Math.floor(num)
  const decPart = Math.round((num - intPart) * 100)
  let rem = intPart
  const parts: string[] = []

  if (rem >= 10_000_000) { parts.push(hundreds(Math.floor(rem / 10_000_000)) + " Crore"); rem %= 10_000_000 }
  if (rem >= 100_000)    { parts.push(hundreds(Math.floor(rem / 100_000)) + " Lakh");   rem %= 100_000 }
  if (rem >= 1_000)      { parts.push(hundreds(Math.floor(rem / 1_000)) + " Thousand"); rem %= 1_000 }
  if (rem > 0)           { parts.push(hundreds(rem)) }

  let result = parts.join(" ")
  if (decPart > 0) result += " and " + tens(decPart) + " Paise"
  return result + " Only"
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params
  const url = new URL(request.url)
  const poNo = url.searchParams.get("poNo") || "—"
  const vehicleNo = url.searchParams.get("vehicleNo") || "—"
  const hsn = url.searchParams.get("hsn") || ""
  const reverseCharge = url.searchParams.get("reverseCharge") === "Yes" ? "Yes" : "No"

  let invoice
  try {
    invoice = await getInvoiceWithPayments(id)
  } catch {
    return new NextResponse("Invoice not found", { status: 404 })
  }

  const { customer, lineItems, basicAmount, cgst, sgst, igst, totalAmount, invoiceNumber, financialYear, invoiceDate } = invoice

  const dcNos = [...new Set(lineItems.map((i) => i.dc?.dcNumber).filter(Boolean))].map((n) => `${n}`).join(", ") || "—"
  const dateStr = format(new Date(invoiceDate), "dd/MM/yyyy")
  const customerStateCode = customer.stateCode || customer.gstin?.slice(0, 2) || ""

  const isIntrastate = customer.taxType === "INTRASTATE"
  const isInterstate = customer.taxType === "INTERSTATE"

  function taxPct(value: number): string {
    if (!value || !basicAmount) return "-"
    return (value / basicAmount * 100).toFixed(0) + "%"
  }

  const cgstPct = isIntrastate ? taxPct(cgst) : "-"
  const sgstPct = isIntrastate ? taxPct(sgst) : "-"
  const igstPct = isInterstate ? taxPct(igst) : "-"

  function taxCell(show: boolean, value: number): string {
    if (!show || !value) return "-"
    return fmtRs(value)
  }

  const cgstCell = taxCell(isIntrastate, cgst)
  const sgstCell = taxCell(isIntrastate, sgst)
  const igstCell = taxCell(isInterstate, igst)

  const lineItemRows = lineItems
    .map((item, i) => {
      const rawDesc = [item.jobType, item.description].filter(Boolean).join(" - ") || "—"
      const desc = rawDesc.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")
      return `
      <tr>
        <td class="center">${i + 1}</td>
        <td>${desc}</td>
        <td class="center">${hsn}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">${fmtRs(item.totalCost)}</td>
        <td class="right">${fmtRs(item.totalCost)}</td>
      </tr>`
    })
    .join("")

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${invoiceNumber}/${financialYear}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; background: #d0d0d0; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 10mm auto;
      background: #fff;
      padding: 12mm;
    }

    @media print {
      body { background: #fff; }
      .page { margin: 0; padding: 0; width: 100%; min-height: unset; }
      @page { size: A4; margin: 12mm; }
    }

    .outer { border: 2px solid #1e3558; border-radius: 2px; overflow: hidden; min-height: 270mm; display: flex; flex-direction: column; }
    .spacer { flex: 1; }

    /* ── Header bar ── */
    .hbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 12px;
      background: #eef1f7;
      color: #1e3558;
      border-bottom: 1.5px solid #b0b8c8;
      font-size: 9.5px;
      line-height: 1.5;
    }
    .hbar-left { font-size: 9px; }
    .hbar-right { font-size: 9px; text-align: right; }
    .gst-label {
      color: #1e3558;
      padding: 4px 18px;
      font-weight: 900;
      font-size: 20px;
      letter-spacing: 1.5px;
    }

    /* ── Company header ── */
    .co-header {
      display: flex;
      align-items: center;
      padding: 8px 12px 9px;
      border-bottom: 1.5px solid #b0b8c8;
      background: #fff;
    }
    .co-logo { flex: 0 0 auto; margin-right: 12px; }
    .co-logo img { width: 68px; height: 68px; object-fit: contain; display: block; }
    .co-text { text-align: left; }
    .co-name { font-size: 21px; font-weight: 900; font-style: italic; letter-spacing: 0.3px; color: #1e3558; }
    .co-line { font-size: 10px; margin-top: 2px; color: #333; }
    .co-bold { font-weight: bold; color: #1e3558; }

    /* ── Bill-to / Invoice-info row ── */
    .info-row {
      display: flex;
      border-bottom: 1px solid #b0b8c8;
    }
    .bill-to {
      flex: 0 0 55%;
      border-right: 1px solid #b0b8c8;
      padding: 5px 9px;
    }
    .inv-info {
      flex: 1;
      padding: 5px 9px;
      background: #fafbfd;
    }
    .inv-info table { border: none; }
    .inv-info td { border: none; padding: 1.5px 4px 1.5px 0; font-size: 10px; vertical-align: top; }
    .lbl { color: #555; }

    /* ── Items table ── */
    table.items { border-collapse: collapse; width: 100%; }
    table.items th, table.items td {
      border: 1px solid #b0b8c8;
      padding: 3px 5px;
      font-size: 10px;
    }
    table.items thead tr { background: #eef1f7; color: #1e3558; }
    table.items thead th { text-align: center; font-size: 9.5px; font-weight: bold; border-color: #b0b8c8; }
    table.items tbody tr:nth-child(even) { background: #f8f9fc; }
    table.items tfoot td { border: 1px solid #b0b8c8; }

    .center { text-align: center; }
    .right  { text-align: right; }
    .bold   { font-weight: bold; }
    .bg-f   { background: #eef1f7 !important; font-weight: bold; }

    /* ── Footer ── */
    .inv-footer {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      padding: 7px 10px 5px;
      border-top: 1.5px solid #1e3558;
    }
    .recv-block { font-size: 10px; color: #333; display: flex; flex-direction: column; justify-content: flex-end; }
    .sig-block { text-align: right; font-size: 10px; min-width: 160px; color: #1e3558; }
    .sig-space { height: 42px; }
  </style>
</head>
<body>
<div class="page">
<div class="outer">

  <!-- Top bar -->
  <div class="hbar">
    <div class="hbar-left">
      GSTIN : ${COMPANY.gstin}<br>
      State Code : ${COMPANY.stateCode}
    </div>
    <div class="gst-label">GST TAX INVOICE</div>
    <div class="hbar-right">Mobile : ${COMPANY.phone}</div>
  </div>

  <!-- Company header -->
  <div class="co-header">
    <div class="co-logo">${logoBase64 ? `<img src="${logoBase64}" alt="Hydrise Logo">` : ""}</div>
    <div class="co-text">
      <div class="co-name">${COMPANY.name}</div>
      <div class="co-line">${COMPANY.tagline1}</div>
      <div class="co-line co-bold">${COMPANY.tagline2}</div>
      <div class="co-line">${COMPANY.address}</div>
      <div class="co-line">E-Mail : ${COMPANY.email}</div>
    </div>
  </div>

  <!-- Bill-to + Invoice info -->
  <div class="info-row">
    <div class="bill-to">
      <div style="font-size:9px; margin-bottom:1px;">M/s</div>
      <div style="font-size:13px; font-weight:bold; margin-bottom:3px;">${customer.name}</div>
      <div style="font-size:10.5px;">${customer.address ?? ""}</div>
      <div style="margin-top:4px; font-size:10.5px;">
        <span class="lbl">GSTIN : </span>${customer.gstin ?? ""}
      </div>
      <div style="font-size:10.5px;">
        <span class="lbl">State Code : </span>${customerStateCode}
      </div>
    </div>
    <div class="inv-info">
      <table>
        <tr>
          <td class="lbl" style="white-space:nowrap;">Invoice No. :</td>
          <td><strong>${invoiceNumber}</strong></td>
          <td class="lbl" style="white-space:nowrap; padding-left:10px;">Date :</td>
          <td>${dateStr}</td>
        </tr>
        <tr>
          <td class="lbl">D.C. No. :</td>
          <td colspan="3">${dcNos}</td>
        </tr>
        <tr>
          <td class="lbl">P.O. No. :</td>
          <td colspan="3">${poNo}</td>
        </tr>
        <tr>
          <td class="lbl">Vehicle No. :</td>
          <td colspan="3">${vehicleNo}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Items table -->
  <table class="items">
    <thead>
      <tr>
        <th style="width:26px;">Sl.<br>No.</th>
        <th>Description of Goods</th>
        <th style="width:48px;">HSN/SAC</th>
        <th style="width:32px;">QTY.</th>
        <th style="width:55px;">RATE</th>
        <th style="width:62px;">AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemRows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2" rowspan="5" style="vertical-align:top; padding:8px 10px; font-size:10px; line-height:1.6;">
          <div style="font-size:9px; margin-bottom:4px;">E. &amp; O.E.</div>
          <strong>Total Invoice Amount in Words :</strong><br>
          ${numberToWords(Math.round(totalAmount))}
        </td>
        <td colspan="3" class="right bold bg-f">Total Amount Before TAX</td>
        <td class="right bold bg-f">${fmtRs(basicAmount)}</td>
      </tr>
      <tr>
        <td colspan="2" class="right">CGST@</td>
        <td class="center">${cgstPct}</td>
        <td class="right">${cgstCell}</td>
      </tr>
      <tr>
        <td colspan="2" class="right">SGST@</td>
        <td class="center">${sgstPct}</td>
        <td class="right">${sgstCell}</td>
      </tr>
      <tr>
        <td colspan="2" class="right">IGST@</td>
        <td class="center">${igstPct}</td>
        <td class="right">${igstCell}</td>
      </tr>
      <tr>
        <td colspan="3" class="right bold bg-f">Total Amount After TAX</td>
        <td class="right bold bg-f">${fmtRs(totalAmount)}</td>
      </tr>
      <tr>
        <td colspan="5" style="font-size:9px;">GST Payable on Reverse Charges</td>
        <td class="center" style="font-size:9px;">${reverseCharge}</td>
      </tr>
    </tfoot>
  </table>

  <div class="spacer"></div>

  <!-- Footer -->
  <div class="inv-footer">
    <div class="recv-block">
      Receiver's Signature
    </div>
    <div class="sig-block">
      For <strong>${COMPANY.name}</strong>
      <div class="sig-space"></div>
      Authorised Signatory
    </div>
  </div>

</div>
</div>

<script>window.onload = function () { window.print(); }</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
