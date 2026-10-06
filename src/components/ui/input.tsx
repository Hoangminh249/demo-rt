import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl px-4 md:h-10 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium border border-border-strong bg-card text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:focus-visible:ring-red-500/10 md:text-sm dark:bg-white/4",
        className
      )}
      {...props}
    />
  )
}

export { Input }
