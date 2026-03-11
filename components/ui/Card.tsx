import { cn } from "@/lib/utils"

export function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-cyan-500/30 hover:bg-white/[0.04]", className)}>
      {children}
    </div>
  )
}
