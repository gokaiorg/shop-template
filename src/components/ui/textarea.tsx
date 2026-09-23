import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-t-xl rounded-b-none border-0 border-b border-gray-300 dark:border-gray-600 bg-black/[0.03] dark:bg-white/5 px-4 py-3 text-base transition-all duration-200 outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:border-primary focus:border-b-2 focus:bg-black/[0.05] dark:focus:bg-white/[0.08] focus:shadow-[0_4px_14px_-2px_rgba(99,102,241,0.35)] focus:ring-0 focus-visible:ring-0 focus-visible:border-primary",
        "aria-invalid:border-destructive aria-invalid:border-b-2 dark:aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
