import { cn } from "@/lib/utils"

export function Section({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) {
  return (
    <section id={id} className={cn("px-6 py-24 sm:px-10", className)}>
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </section>
  )
}
