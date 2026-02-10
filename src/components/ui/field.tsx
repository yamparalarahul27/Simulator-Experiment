"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Field({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1.5", className)} {...props} />
}

function FieldLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-white/60 text-xs font-mono uppercase tracking-wider",
        className
      )}
      {...props}
    />
  )
}

export { Field, FieldLabel }
