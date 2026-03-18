import { cn } from "@/lib/utils"

export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "panel relative overflow-hidden rounded-[22px] border border-white/10 p-6 transition-colors hover:border-cyan-300/20",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.1),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.07),transparent_32%)]" />
      <div className="relative">{children}</div>
    </div>
  )
}
