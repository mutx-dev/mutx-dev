"use client";

import { useState } from "react";
import { Settings, Power, RotateCcw, Shield, Server, Database, Globe, Key, Bell, Sliders } from "lucide-react";

interface SystemService {
  name: string;
  status: "running" | "stopped" | "error";
  uptime: string;
  cpu: string;
  memory: string;
}

const mockServices: SystemService[] = [
  { name: "API Server", status: "running", uptime: "14d 3h", cpu: "12%", memory: "256MB" },
  { name: "Agent Runtime", status: "running", uptime: "14d 3h", cpu: "45%", memory: "1.2GB" },
  { name: "Database", status: "running", uptime: "14d 3h", cpu: "8%", memory: "512MB" },
  { name: "Cache Layer", status: "running", uptime: "14d 3h", cpu: "2%", memory: "128MB" },
  { name: "Webhook Dispatcher", status: "stopped", uptime: "0m", cpu: "0%", memory: "0MB" },
  { name: "Log Aggregator", status: "running", uptime: "5d 12h", cpu: "15%", memory: "384MB" },
];

const statusColors = {
  running: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  stopped: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  error: "text-rose-400 bg-rose-400/10 border-rose-400/20",
};

export default function DashboardControlPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Control</h1>
          <p className="mt-1 text-sm text-slate-400">System configuration and service management</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-4">
        <button className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0e] p-4 hover:border-white/20 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10">
            <Power className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Restart All</p>
            <p className="text-xs text-slate-400">Full system restart</p>
          </div>
        </button>
        <button className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0e] p-4 hover:border-white/20 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10">
            <RotateCcw className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Reload Config</p>
            <p className="text-xs text-slate-400">Hot reload settings</p>
          </div>
        </button>
        <button className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0e] p-4 hover:border-white/20 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-400/10">
            <Shield className="h-5 w-5 text-violet-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Security</p>
            <p className="text-xs text-slate-400">Auth & permissions</p>
          </div>
        </button>
        <button className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0e] p-4 hover:border-white/20 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10">
            <Sliders className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Preferences</p>
            <p className="text-xs text-slate-400">System defaults</p>
          </div>
        </button>
      </div>

      {/* Services Table */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0e]">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Services</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4 font-medium">Service</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Uptime</th>
                <th className="px-6 py-4 font-medium">CPU</th>
                <th className="px-6 py-4 font-medium">Memory</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockServices.map((service) => (
                <tr key={service.name} className="hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{service.name}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusColors[service.status]}`}>
                      {service.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{service.uptime}</td>
                  <td className="px-6 py-4 text-slate-300">{service.cpu}</td>
                  <td className="px-6 py-4 text-slate-300">{service.memory}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
                        <Power className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
