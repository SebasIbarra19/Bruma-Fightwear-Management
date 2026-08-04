import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-obsidian/80 border border-bone/5 rounded-[2px] animate-bruma-pulse relative overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Optional: Add a subtle overlay gradient to mimic the fog passing over */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-bone/5 to-transparent" />
    </div>
  )
}

export { Skeleton }
