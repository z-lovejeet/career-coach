import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5.5 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap transition-colors [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-foreground border-primary/20",
        secondary:
          "bg-muted text-muted-foreground border-border",
        outline:
          "border-border text-muted-foreground bg-transparent",
        destructive:
          "bg-rose-50 text-rose-800 border-rose-200",
        success:
          "bg-emerald-50 text-emerald-800 border-emerald-200",
        warning:
          "bg-amber-50 text-amber-900 border-amber-200",
        ghost:
          "hover:bg-muted text-muted-foreground border-transparent",
        link: "text-primary underline-offset-4 hover:underline border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
