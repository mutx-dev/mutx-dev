"use client";

import type { Metadata } from "next";
import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Menu, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard - MUTX",
  description: "View and manage your agents and deployments",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#030307] text-slate-100">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[30%] w-[30%] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-[rgba(255,255,255,0.06)] bg-[#0a0a0e]/95 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22d3ee]">
              <svg className="h-5 w-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">MUTX</span>
          </div>
          <div className="w-10" /> {/* Spacer for balance */}
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <div className={`fixed left-0 top-0 z-50 h-screen transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="relative h-full">
          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          <Sidebar />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 lg:ml-[280px] lg:pt-0">
        <div className="relative mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
