import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-lg border border-input bg-card/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] outline-none focus-visible:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-rose-500/50 aria-invalid:ring-2 aria-invalid:ring-rose-500/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
