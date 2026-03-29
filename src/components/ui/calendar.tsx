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
        caption_label: "text-sm font-mono text-[#ced5e4]",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "h-8 w-8 bg-[#11141a] border border-[#1a1e26] text-white hover:bg-[#171a20] rounded-lg inline-flex items-center justify-center [&_svg]:text-white [&_svg]:stroke-white"
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-[#585e6c] rounded-lg w-9 font-mono text-[0.7rem] uppercase",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-[#11141a] [&:has([aria-selected])]:text-white",
        day: "h-9 w-9 p-0 font-mono text-xs rounded-lg hover:bg-[#171a20]",
        day_selected:
          "bg-[#00b3b3]/30 text-white hover:bg-[#00b3b3]/40 focus:bg-[#00b3b3]/40",
        day_today: "border border-white/20",
        day_outside: "text-[#585e6c] opacity-50",
        day_disabled: "text-[#585e6c] opacity-50",
        day_range_middle:
          "aria-selected:bg-[#00b3b3]/15 aria-selected:text-white",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
