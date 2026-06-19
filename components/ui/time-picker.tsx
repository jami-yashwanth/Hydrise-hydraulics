"use client"

import { useState } from "react"
import { Clock } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

interface TimePickerProps {
  name: string
  defaultValue?: string
  disabled?: boolean
}

export function TimePicker({ name, defaultValue, disabled }: TimePickerProps) {
  const [hour, setHour] = useState(defaultValue?.split(":")?.[0] ?? "")
  const [minute, setMinute] = useState(defaultValue?.split(":")?.[1] ?? "")

  const value = hour && minute ? `${hour}:${minute}` : ""

  return (
    <div className="flex items-center gap-1.5">
      <input type="hidden" name={name} value={value} />
      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Select value={hour} onValueChange={setHour} disabled={disabled}>
        <SelectTrigger className="w-[4.5rem] h-9">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          {HOURS.map((h) => (
            <SelectItem key={h} value={h}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground font-semibold select-none">:</span>
      <Select value={minute} onValueChange={setMinute} disabled={disabled}>
        <SelectTrigger className="w-[4.5rem] h-9">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
