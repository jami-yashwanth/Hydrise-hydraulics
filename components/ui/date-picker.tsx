"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  name: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export function DatePicker({
  name,
  defaultValue,
  placeholder = "Pick a date",
  required,
  disabled,
}: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(() => {
    if (!defaultValue) return undefined
    const d = new Date(defaultValue + "T12:00:00")
    return isNaN(d.getTime()) ? undefined : d
  })
  const [open, setOpen] = useState(false)

  return (
    <>
      <input
        type="hidden"
        name={name}
        value={date ? format(date, "yyyy-MM-dd") : ""}
        required={required}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal h-9",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            {date ? format(date, "dd MMM yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) { setDate(d); setOpen(false) }
            }}
          />
        </PopoverContent>
      </Popover>
    </>
  )
}
