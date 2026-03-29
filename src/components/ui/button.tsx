"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-mono transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--bs-border)] disabled:pointer-events-none disabled:opacity-50 rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-[var(--bs-card-fg)] text-[var(--bs-text-primary)] hover:bg-[var(--bs-card-fg)] border border-[var(--bs-border)]",
        outline: "border border-[var(--bs-border)] bg-[var(--bs-bg)]/40 text-[var(--bs-text-primary)] hover:bg-[var(--bs-card-fg)]",
        ghost: "bg-transparent text-[var(--bs-text-secondary)] hover:bg-[var(--bs-card-fg)] hover:text-[var(--bs-text-primary)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
