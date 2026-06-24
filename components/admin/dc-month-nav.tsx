"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { fyMonths } from "@/lib/fy"

function prevMonth(m: string) {
  const [y, mo] = m.split("-").map(Number)
  const d = new Date(y, mo - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function nextMonth(m: string) {
  const [y, mo] = m.split("-").map(Number)
  const d = new Date(y, mo, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

interface Props {
  currentMonth: string
  currentFY: string
}

export function DCMonthNav({ currentMonth, currentFY }: Props) {
  const router = useRouter()
  const fyMonthList = fyMonths(currentFY)
  const isFirstMonth = fyMonthList[0] === currentMonth
  const isLastMonth = fyMonthList[fyMonthList.length - 1] === currentMonth

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={isFirstMonth}
        onClick={() => router.push(`/admin/dcs?month=${prevMonth(currentMonth)}`)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <input
        type="month"
        value={currentMonth}
        min={fyMonthList[0]}
        max={fyMonthList[fyMonthList.length - 1]}
        onChange={(e) => router.push(`/admin/dcs?month=${e.target.value}`)}
        className="h-8 px-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={isLastMonth}
        onClick={() => router.push(`/admin/dcs?month=${nextMonth(currentMonth)}`)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
