"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-mono transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50 rounded-none",
  {
    variants: {
      variant: {
        default: "bg-[#171a20] text-white hover:bg-[#171a20] border border-[#1a1e26]",
        outline: "border border-white/15 bg-[#0b0e14]/40 text-white hover:bg-[#171a20]",
        ghost: "bg-transparent text-[#ced5e4] hover:bg-[#171a20] hover:text-white",
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
