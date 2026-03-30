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
      className={cn("p-3 text-bs-text-primary", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex items-center justify-between pt-1",
        caption_label: "text-sm font-mono text-bs-text-secondary",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "h-8 w-8 bg-bs-card border border-bs-border text-bs-text-primary hover:bg-bs-card-fg rounded-lg inline-flex items-center justify-center [&_svg]:text-bs-text-primary [&_svg]:stroke-white"
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-bs-text-mute rounded-lg w-9 font-mono text-[0.7rem] uppercase",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-bs-card [&:has([aria-selected])]:text-bs-text-primary",
        day: "h-9 w-9 p-0 font-mono text-xs rounded-lg hover:bg-bs-card-fg",
        day_selected:
          "bg-bs-brand-tertiary/30 text-bs-text-primary hover:bg-bs-brand-tertiary/40 focus:bg-bs-brand-tertiary/40",
        day_today: "border border-bs-border",
        day_outside: "text-bs-text-mute opacity-50",
        day_disabled: "text-bs-text-mute opacity-50",
        day_range_middle:
          "aria-selected:bg-bs-brand-tertiary/15 aria-selected:text-bs-text-primary",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
