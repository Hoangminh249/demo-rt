import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// Dáng theo skill evon (I1, button.md): outline là mặc định · default (= primary) · secondary · ghost,
// + destructive nền đỏ mờ (luật khoá 2). Cao 40px, bo 12px; nút thấp hơn 40px bo 8px (luật khoá 10). Không bóng.
const variants = cva(
  "inline-flex max-w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent text-center text-sm leading-tight font-medium transition-colors outline-none select-none [overflow-wrap:anywhere] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        outline: "border-border-strong bg-card text-foreground hover:bg-button-hover aria-expanded:bg-button-hover",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        ghost: "bg-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground aria-expanded:bg-foreground/5",
        destructive: "bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-400",
        link: "h-auto min-h-0 px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-10 px-4 py-2",
        xs: "min-h-7 gap-1 rounded-lg px-2 text-xs",
        sm: "min-h-8 gap-1.5 rounded-lg px-3",
        lg: "min-h-11 px-5 text-base",
        icon: "size-10",
        "icon-xs": "size-7 rounded-lg",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
    },
  }
)

// Luôn qua tailwind-merge: phần chung có border-transparent, variant outline đè bằng border-border-strong.
// Dùng thẳng cva trên <a>/<Link> thì cả hai class cùng nằm đó và thứ tự CSS cho transparent thắng → nút viền mất viền.
const buttonVariants = (...args: Parameters<typeof variants>) => cn(variants(...args))

function Button({
  className,
  variant = "outline",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
