import { cn } from "@/lib/utils"

export function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("panel relative overflow-hidden rounded-[28px] border border-white/10 p-8 transition-all duration-500 hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-[0_24px_80px_rgba(8,145,178,0.16)]", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(103,232,249,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.08),transparent_26%)] opacity-80" />
      <div className="relative">{children}</div>
    </div>
  )
}
