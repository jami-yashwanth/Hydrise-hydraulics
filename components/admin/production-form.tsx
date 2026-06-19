"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import Link from "next/link"
import { format } from "date-fns"

interface Customer { id: string; name: string }
interface Employee { id: string; name: string }

interface DefaultValues {
  chromePlatingDate?: Date
  customerDcNo?: string | null
  customerDcDate?: Date | null
  dc?: { dcNumber: string; financialYear: string } | null
  quantity?: number
  customerId?: string
  employeeId?: string | null
  rodDiaMm?: number
  rodLengthMm?: number
  chromePlatingMicrons?: number
  area?: number
  costPerSqIn?: number
  totalCost?: number
  jobType?: string | null
  description?: string | null
  additionalRequirements?: string | null
  inTime?: string | null
  outTime?: string | null
  temperature?: number | null
  density?: number | null
  cathodeCurrent?: number | null
  anodeCurrent?: number | null
  currentReading?: string | null
  chromeThickness?: string | null
  remarks?: string | null
  status?: "PENDING" | "SUCCESS" | "FAILED"
}

interface Props {
  action: (formData: FormData) => Promise<void>
  customers: Customer[]
  employees: Employee[]
  defaultValues?: DefaultValues
  isInvoiced?: boolean
}

const PI = Math.PI

function calcArea(dia: number, length: number) {
  if (!dia || !length) return 0
  return parseFloat(((PI * dia * length) / 645.16).toFixed(2))
}

function fmtDate(d?: Date | null) {
  if (!d) return ""
  return format(new Date(d), "yyyy-MM-dd")
}

export function ProductionForm({ action, customers, employees, defaultValues, isInvoiced }: Props) {
  const [dia, setDia] = useState(defaultValues?.rodDiaMm?.toString() ?? "")
  const [length, setLength] = useState(defaultValues?.rodLengthMm?.toString() ?? "")
  const [rate, setRate] = useState(defaultValues?.costPerSqIn?.toString() ?? "")
  const [totalCost, setTotalCost] = useState(defaultValues?.totalCost?.toString() ?? "")
  const [totalCostEdited, setTotalCostEdited] = useState(false)
  const [description, setDescription] = useState(defaultValues?.description ?? "")
  const [descriptionEdited, setDescriptionEdited] = useState(!!defaultValues?.description)
  const [status, setStatus] = useState<"PENDING" | "SUCCESS" | "FAILED">(defaultValues?.status ?? "PENDING")
  const [customerId, setCustomerId] = useState(defaultValues?.customerId ?? "")
  const [employeeId, setEmployeeId] = useState(defaultValues?.employeeId ?? "")

  const area = calcArea(parseFloat(dia) || 0, parseFloat(length) || 0)

  // Auto-recalculate total cost when area or rate changes, unless user has manually edited it
  useEffect(() => {
    if (!totalCostEdited && status !== "FAILED") {
      const computed = area * (parseFloat(rate) || 0)
      setTotalCost(computed > 0 ? computed.toFixed(2) : "")
    }
    if (status === "FAILED") {
      setTotalCost("0")
    }
  }, [area, rate, status, totalCostEdited])

  // Auto-generate description from dia × length unless user has manually edited it
  useEffect(() => {
    if (descriptionEdited) return
    const d = parseFloat(dia) || 0
    const l = parseFloat(length) || 0
    if (d && l) {
      const fmt = (n: number) => (n % 1 === 0 ? String(n) : String(n))
      setDescription(`φ ${fmt(d)} × ${fmt(l)} mm`)
    } else {
      setDescription("")
    }
  }, [dia, length, descriptionEdited])

  const locked = !!isInvoiced

  return (
    <form action={action} className="space-y-6">
      {/* Hidden fields */}
      <input type="hidden" name="area" value={area} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="totalCost" value={totalCost} />

      {/* Document Info */}
      <div className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Document Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Chrome Plating Date <span className="text-destructive">*</span></Label>
            <DatePicker
              name="chromePlatingDate"
              defaultValue={fmtDate(defaultValues?.chromePlatingDate) || fmtDate(new Date())}
              required
              disabled={locked}
            />
          </div>
          <div />
          <div className="space-y-1.5">
            <Label>Customer DC No.</Label>
            <Input name="customerDcNo" defaultValue={defaultValues?.customerDcNo ?? ""} disabled={locked} />
          </div>
          <div className="space-y-1.5">
            <Label>Customer DC Date</Label>
            <DatePicker
              name="customerDcDate"
              defaultValue={fmtDate(defaultValues?.customerDcDate)}
              placeholder="Pick a date"
              disabled={locked}
            />
          </div>
          {defaultValues?.dc && (
            <div className="col-span-2 flex items-center gap-2 py-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hydrise DC</span>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                #{defaultValues.dc.dcNumber} / {defaultValues.dc.financialYear}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Customer & Operator */}
      <div className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Customer & Operator</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Customer <span className="text-destructive">*</span></Label>
            <Select value={customerId} onValueChange={setCustomerId} required disabled={locked}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Operator</Label>
            <Select value={employeeId || "none"} onValueChange={(v) => setEmployeeId(v === "none" ? "" : v)} disabled={locked}>
              <SelectTrigger>
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Rod & Costing */}
      <div className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Rod & Cost</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Rod Dia (mm) <span className="text-destructive">*</span></Label>
            <Input
              name="rodDiaMm"
              type="number"
              step="any"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              required
              disabled={locked}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Rod Length (mm) <span className="text-destructive">*</span></Label>
            <Input
              name="rodLengthMm"
              type="number"
              step="any"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              required
              disabled={locked}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Chrome Plating (Microns)</Label>
            <Input name="chromePlatingMicrons" type="number" step="any" defaultValue={defaultValues?.chromePlatingMicrons ?? 30} disabled={locked} />
          </div>
          <div className="space-y-1.5">
            <Label>Area (sq in)</Label>
            <Input value={area > 0 ? area.toFixed(2) : ""} readOnly className="bg-gray-50 text-muted-foreground" disabled={locked} />
          </div>
          <div className="space-y-1.5">
            <Label>Cost per In² / 30 Microns</Label>
            <Input
              name="costPerSqIn"
              type="number"
              step="any"
              value={rate}
              onChange={(e) => { setRate(e.target.value); setTotalCostEdited(false) }}
              disabled={locked}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Total Cost</Label>
            <Input
              type="number"
              step="any"
              value={totalCost}
              onChange={(e) => { setTotalCost(e.target.value); setTotalCostEdited(true) }}
              disabled={locked || status === "FAILED"}
              placeholder={status === "FAILED" ? "0 (auto)" : ""}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Additional Requirements</Label>
          <Input name="additionalRequirements" defaultValue={defaultValues?.additionalRequirements ?? ""} placeholder="e.g. 60 MICRONS" disabled={locked} />
        </div>
      </div>

       {/* Job Type & Description */}
      <div className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Job Details</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="jobType">Job Type <span className="text-destructive">*</span></Label>
              <Input id="jobType" name="jobType" defaultValue={defaultValues?.jobType ?? ""} required disabled={locked} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                step={1}
                defaultValue={defaultValues?.quantity ?? 1}
                disabled={locked}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jobDescription">Description <span className="text-destructive">*</span></Label>
            <Textarea
              id="jobDescription"
              name="description"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setDescriptionEdited(true) }}
              required
              disabled={locked}
              rows={3}
            />
          </div>
        </div>
      </div>


      {/* Process Parameters */}
      <div className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Process Parameters</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>In Time</Label>
            <Input name="inTime" type="time" defaultValue={defaultValues?.inTime ?? ""} disabled={locked} />
          </div>
          <div className="space-y-1.5">
            <Label>Out Time</Label>
            <Input name="outTime" type="time" defaultValue={defaultValues?.outTime ?? ""} disabled={locked} />
          </div>
          <div className="space-y-1.5">
            <Label>Temperature</Label>
            <Input name="temperature" type="number" step="any" defaultValue={defaultValues?.temperature ?? ""} disabled={locked} />
          </div>
          <div className="space-y-1.5">
            <Label>Density</Label>
            <Input name="density" type="number" step="any" defaultValue={defaultValues?.density ?? ""} disabled={locked} />
          </div>
          <div className="space-y-1.5">
            <Label>Cathode Current</Label>
            <Input name="cathodeCurrent" type="number" step="any" defaultValue={defaultValues?.cathodeCurrent ?? ""} disabled={locked} />
          </div>
          <div className="space-y-1.5">
            <Label>Anode Current</Label>
            <Input name="anodeCurrent" type="number" step="any" defaultValue={defaultValues?.anodeCurrent ?? ""} disabled={locked} />
          </div>
          <div className="space-y-1.5">
            <Label>Current Reading</Label>
            <Input name="currentReading" defaultValue={defaultValues?.currentReading ?? ""} placeholder="e.g. 2-2" disabled={locked} />
          </div>
          <div className="space-y-1.5">
            <Label>Chrome Thickness</Label>
            <Input name="chromeThickness" defaultValue={defaultValues?.chromeThickness ?? ""} placeholder="e.g. 45-60" disabled={locked} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Remarks</Label>
          <Input name="remarks" defaultValue={defaultValues?.remarks ?? ""} disabled={locked} />
        </div>
      </div>

      {/* Status */}
      <div className="bg-white border rounded-lg p-5 space-y-3">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Status</h2>
        <div className="flex gap-3">
          {(["PENDING", "SUCCESS", "FAILED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => !locked && setStatus(s)}
              disabled={locked}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                status === s
                  ? s === "SUCCESS"
                    ? "bg-green-100 border-green-400 text-green-800"
                    : s === "FAILED"
                    ? "bg-red-100 border-red-400 text-red-800"
                    : "bg-yellow-100 border-yellow-400 text-yellow-800"
                  : "bg-white border-gray-200 text-muted-foreground hover:bg-gray-50"
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        {status === "FAILED" && (
          <p className="text-xs text-red-600">Total cost will be set to 0 for failed entries.</p>
        )}
      </div>

      {!locked && (
        <div className="flex gap-3">
          <Button type="submit">{defaultValues ? "Save changes" : "Create Entry"}</Button>
          <Button variant="outline" asChild><Link href="/admin/production">Cancel</Link></Button>
        </div>
      )}
    </form>
  )
}
