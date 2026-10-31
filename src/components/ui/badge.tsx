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
          "bg-blue-500/15 text-blue-400 border-blue-500/25",
        secondary:
          "bg-[#151926] text-[#A1ADBF] border-white/[0.08]",
        outline:
          "border-white/[0.12] text-[#D4DCE8] bg-transparent",
        destructive:
          "bg-rose-500/15 text-rose-300 border-rose-500/25",
        success:
          "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
        warning:
          "bg-amber-500/15 text-amber-300 border-amber-500/25",
        ghost:
          "hover:bg-white/[0.06] text-[#8A96AA] border-transparent",
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
