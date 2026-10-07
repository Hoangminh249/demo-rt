import * as React from "react"
import { cn } from "cn"

// Dáng theo skill evon (input.md): nền surface (không trong suốt), viền border-strong cùng viền nút outline,
// focus đổi viền + ring mờ. h-11 md:h-10 trong app; form đứng một mình (đăng nhập) truyền h-12.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border border-border-strong bg-card px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-focus focus:ring-2 focus:ring-focus disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:h-10 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
