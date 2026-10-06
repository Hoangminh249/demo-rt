import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-xl px-4 py-2.5 border border-border-strong bg-card text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:focus-visible:ring-red-500/10 md:text-sm dark:bg-white/4",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
