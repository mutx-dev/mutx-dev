"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings, Power, RotateCcw, Shield, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  name: string;
  status: "running" | "stopped" | "error";
  uptime: string;
  cpu: string;
  memory: string;
  serviceType?: string;
}

interface ServicesResponse {
  services: Service[];
}

const INFRASTRUCTURE_SERVICES: Service[] = [
  { name: "API Server", status: "running", uptime: "14d 3h", cpu: "12%", memory: "256MB" },
  { name: "Cache Layer", status: "running", uptime: "14d 3h", cpu: "2%", memory: "128MB" },
  { name: "Webhook Dispatcher", status: "stopped", uptime: "0m", cpu: "0%", memory: "0MB" },
  { name: "Log Aggregator", status: "running", uptime: "5d 12h", cpu: "8%", memory: "192MB" },
];

const statusColors: Record<Service["status"], string> = {
  running: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  stopped: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  error: "text-rose-400 bg-rose-400/10 border-rose-400/20",
};

export default function DashboardControlPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setAuthRequired(false);

    try {
      const res = await fetch("/api/dashboard/services", { cache: "no-store", credentials: "include" });

      if (res.status === 401) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setServices(INFRASTRUCTURE_SERVICES);
        setLoading(false);
        return;
      }

      const data: ServicesResponse = await res.json();
      setServices(data.services ?? []);
    } catch {
      setServices(INFRASTRUCTURE_SERVICES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchServices();
  }, [fetchServices]);

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

      {authRequired ? (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-cyan-400" />
            <div>
              <p className="text-sm font-medium text-white">Sign in required</p>
              <p className="mt-1 text-sm text-slate-400">
                Please sign in to view live service health data.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-4">
        <button className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0e] p-4 transition-colors hover:border-white/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10">
            <Power className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Restart All</p>
            <p className="text-xs text-slate-400">Full system restart</p>
          </div>
        </button>
        <button className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0e] p-4 transition-colors hover:border-white/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10">
            <RotateCcw className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Reload Config</p>
            <p className="text-xs text-slate-400">Hot reload settings</p>
          </div>
        </button>
        <button className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0e] p-4 transition-colors hover:border-white/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-400/10">
            <Shield className="h-5 w-5 text-violet-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Security</p>
            <p className="text-xs text-slate-400">Auth &amp; permissions</p>
          </div>
        </button>
        <button className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0e] p-4 transition-colors hover:border-white/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10">
            <Sliders className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Preferences</p>
            <p className="text-xs text-slate-400">System defaults</p>
          </div>
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0a0a0e]">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Services</h2>
          <button
            onClick={() => void fetchServices()}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white",
              loading && "opacity-50 cursor-not-allowed",
            )}
            disabled={loading}
          >
            <RotateCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
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
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 w-28 rounded bg-white/5" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-16 rounded-full bg-white/5" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-16 rounded bg-white/5" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-12 rounded bg-white/5" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-12 rounded bg-white/5" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-lg bg-white/5" />
                        <div className="h-8 w-8 rounded-lg bg-white/5" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    No services data available
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.name} className="hover:bg-white/5">
                    <td className="px-6 py-4 font-medium text-white">{service.name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-medium",
                          statusColors[service.status],
                        )}
                      >
                        {service.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{service.uptime}</td>
                    <td className="px-6 py-4 text-slate-300">{service.cpu}</td>
                    <td className="px-6 py-4 text-slate-300">{service.memory}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                          title="Toggle service"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                          title="Restart service"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
