import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params
  const url = new URL(request.url)
  const orderNo  = url.searchParams.get("orderNo")  || "—"
  const orderDate = url.searchParams.get("orderDate") || ""
  const vehicleNo = url.searchParams.get("vehicleNo") || "—"

  const dc = await prisma.dC.findUnique({
    where: { id },
    include: {
      customer: true,
      entries: {
        orderBy: { chromePlatingDate: "asc" },
        select: {
          chromePlatingDate: true,
          customerDcNo: true,
          jobType: true,
          description: true,
          quantity: true,
          rodDiaMm: true,
          rodLengthMm: true,
        },
      },
    },
  })

  if (!dc) return new NextResponse("DC not found", { status: 404 })

  const { customer, entries, dcNumber, financialYear, dcDate } = dc
  const dcDateStr = format(new Date(dcDate), "dd/MM/yy")
  const orderDateStr = orderDate ? format(new Date(orderDate), "dd/MM/yy") : "—"

  const lineRows = entries
    .map((e, i) => {
      const rawDesc = [e.jobType, e.description].filter(Boolean).join(" - ") || "—"
      const desc = rawDesc.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")
      const custDc = e.customerDcNo ? `<br><span style="font-size:9px;color:#555;">Cust DC: ${e.customerDcNo}</span>` : ""
      return `
      <tr>
        <td class="center">${i + 1}</td>
        <td>${desc}${custDc}</td>
        <td class="center">${e.quantity} No${e.quantity !== 1 ? "s" : ""}.</td>
      </tr>`
    })
    .join("")

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DC #${dcNumber}/${financialYear}</title>
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

    /* ── Top bar ── */
    .tbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 12px;
      background: #eef1f7;
      border-bottom: 1.5px solid #b0b8c8;
      font-size: 9.5px;
      line-height: 1.5;
    }
    .tbar-left { font-size: 9px; color: #333; }
    .tbar-right { font-size: 9px; color: #333; }
    .dc-label {
      padding: 3px 18px;
      font-weight: 900;
      font-size: 20px;
      letter-spacing: 1.5px;
      color: #1e3558;
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
    .co-logo img { width: 64px; height: 64px; object-fit: contain; display: block; }
    .co-text { text-align: left; }
    .co-name { font-size: 21px; font-weight: 900; letter-spacing: 0.3px; color: #1e3558; font-style: italic; }
    .co-line { font-size: 10px; margin-top: 2px; color: #333; }
    .co-bold { font-weight: bold; color: #1e3558; }

    /* ── Info row ── */
    .info-row {
      display: flex;
      border-bottom: 1px solid #b0b8c8;
    }
    .addr-col {
      flex: 0 0 55%;
      border-right: 1px solid #b0b8c8;
      padding: 8px 10px;
    }
    .meta-col {
      flex: 1;
      padding: 6px 10px;
    }
    .meta-table { border: none; width: 100%; }
    .meta-table td { border: none; padding: 3px 4px; font-size: 10px; vertical-align: top; }
    .meta-val { font-weight: 600; }
    .lbl { color: #555; white-space: nowrap; }

    /* ── Items table ── */
    table.items { border-collapse: collapse; width: 100%; }
    table.items th, table.items td {
      border: 1px solid #b0b8c8;
      padding: 5px 8px;
      font-size: 10px;
    }
    table.items thead tr { background: #eef1f7; color: #1e3558; }
    table.items thead th { text-align: center; font-size: 9.5px; font-weight: bold; border-color: #b0b8c8; }
    table.items tbody tr:nth-child(even) { background: #f8f9fc; }
    .center { text-align: center; }
    .right  { text-align: right; }

    /* ── Footer ── */
    .spacer { flex: 1; }
    .dc-footer {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      padding: 10px 12px 8px;
      border-top: 1.5px solid #b0b8c8;
      font-size: 10px;
    }
    .recv-block { color: #333; display: flex; flex-direction: column; justify-content: space-between; }
    .sig-block { text-align: right; color: #1e3558; font-size: 10px; }
    .sig-space { height: 48px; }
  </style>
</head>
<body>
<div class="page">
<div class="outer">

  <!-- Top bar -->
  <div class="tbar">
    <div class="tbar-left">
      GSTIN : ${COMPANY.gstin}<br>
      Code : ${COMPANY.stateCode}
    </div>
    <div class="dc-label">DELIVERY CHALLAN</div>
    <div class="tbar-right">Mobile : ${COMPANY.phone}</div>
  </div>

  <!-- Company header -->
  <div class="co-header">
    <div class="co-logo">${logoBase64 ? `<img src="${logoBase64}" alt="Logo">` : ""}</div>
    <div class="co-text">
      <div class="co-name">${COMPANY.name}</div>
      <div class="co-line">${COMPANY.tagline1}</div>
      <div class="co-line co-bold">${COMPANY.tagline2}</div>
      <div class="co-line">${COMPANY.address}</div>
      <div class="co-line">E-Mail : ${COMPANY.email}</div>
    </div>
  </div>

  <!-- Address + Meta -->
  <div class="info-row">
    <div class="addr-col">
      <div style="font-size:9px; margin-bottom:2px;">M/s</div>
      <div style="font-size:13px; font-weight:bold; margin-bottom:4px;">${customer.name}</div>
      <div style="font-size:10.5px; line-height:1.55;">${(customer.address ?? "").replace(/\n/g, "<br>")}</div>
      ${customer.gstin ? `<div style="margin-top:5px; font-size:10px;"><span class="lbl">GSTIN : </span>${customer.gstin}</div>` : ""}
      ${customer.stateCode ? `<div style="font-size:10px;"><span class="lbl">State Code : </span>${customer.stateCode}</div>` : ""}
    </div>
    <div class="meta-col">
      <table class="meta-table">
        <tr>
          <td class="lbl">D.C.No.</td>
          <td class="meta-val" style="color:#1e3558; font-size:13px;">: ${dcNumber}</td>
        </tr>
        <tr>
          <td class="lbl">Date</td>
          <td class="meta-val">: ${dcDateStr}</td>
        </tr>
        <tr>
          <td class="lbl">Your Order No.</td>
          <td class="meta-val">: ${orderNo}</td>
        </tr>
        <tr>
          <td class="lbl">Date</td>
          <td class="meta-val">: ${orderDateStr}</td>
        </tr>
        <tr>
          <td class="lbl">Vehicle No.</td>
          <td class="meta-val">: ${vehicleNo}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Items table -->
  <table class="items">
    <thead>
      <tr>
        <th style="width:36px;">Sl.<br>No.</th>
        <th>DESCRIPTION OF GOODS</th>
        <th style="width:80px;">Qty.</th>
      </tr>
    </thead>
    <tbody>
      ${lineRows}
    </tbody>
  </table>

  <div class="spacer"></div>

  <!-- Footer -->
  <div class="dc-footer">
    <div class="recv-block">
      <span>Received goods in good condition</span>
      <span style="font-size:9.5px; color:#555;">Receiver's Signature</span>
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
