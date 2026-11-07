"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { motion, useReducedMotion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color,box-shadow] duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default: "liquid-button",
        outline:
          "border-border bg-card/45 text-foreground hover:border-primary/25 hover:bg-accent shadow-xs",
        secondary:
          "border-border bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
        destructive:
          "border-rose-200 bg-rose-50 text-destructive hover:bg-rose-100",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-4 text-sm",
        xs: "h-7 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8.5 gap-1.5 px-2.5 text-xs font-medium [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-sm font-semibold",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const reducedMotion = useReducedMotion();
  return (
    <ButtonPrimitive
      render={
        <motion.button
          whileHover={
            reducedMotion ? undefined : { y: -1, scaleX: 1.012, scaleY: 1.02 }
          }
          whileTap={
            reducedMotion ? undefined : { y: 0, scaleX: 1.025, scaleY: 0.95 }
          }
          transition={{
            type: "spring",
            stiffness: 410,
            damping: 23,
            mass: 0.55,
          }}
        />
      }
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
