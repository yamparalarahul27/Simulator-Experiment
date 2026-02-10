"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 text-white", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex items-center justify-between pt-1",
        caption_label: "text-sm font-mono text-white/80",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "h-8 w-8 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-none inline-flex items-center justify-center [&_svg]:text-white [&_svg]:stroke-white"
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-white/40 rounded-none w-9 font-mono text-[0.7rem] uppercase",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-white/5 [&:has([aria-selected])]:text-white",
        day: "h-9 w-9 p-0 font-mono text-xs rounded-none hover:bg-white/10",
        day_selected:
          "bg-purple-500/30 text-white hover:bg-purple-500/40 focus:bg-purple-500/40",
        day_today: "border border-white/20",
        day_outside: "text-white/20 opacity-50",
        day_disabled: "text-white/20 opacity-50",
        day_range_middle:
          "aria-selected:bg-purple-500/15 aria-selected:text-white",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
