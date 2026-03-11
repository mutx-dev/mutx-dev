import { cn } from "@/lib/utils"

export function Section({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) {
  return (
    <section id={id} className={cn("relative px-6 py-24 sm:px-10 lg:py-28", className)}>
      <div className="mx-auto max-w-[1280px]">
        {children}
      </div>
    </section>
  )
}
