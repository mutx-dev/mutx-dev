import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Agents",
  description: "View and manage your agents",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#030307] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[30%] w-[30%] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
