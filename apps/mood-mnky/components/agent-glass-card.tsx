import { cn } from "@/lib/utils"

export function AgentGlassCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "main-glass-panel-card main-float rounded-xl p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
