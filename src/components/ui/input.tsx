import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-card/50 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] outline-none focus-visible:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-rose-500/50 aria-invalid:ring-2 aria-invalid:ring-rose-500/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
