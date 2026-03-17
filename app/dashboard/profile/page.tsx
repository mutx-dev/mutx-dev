"use client";

import { useEffect, useState } from "react";
import { User, Mail, Calendar, Shield, Bell, Key } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
        Error: {error}
      </div>
    );
  }

  const createdDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Profile & Settings</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your account and preferences
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0a0a0e]/60 p-6">
        <h2 className="mb-4 text-lg font-medium text-white">Account Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg bg-[rgba(255,255,255,0.03)] p-4">
            <Mail className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm text-white">{user?.email || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-[rgba(255,255,255,0.03)] p-4">
            <User className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Username</p>
              <p className="text-sm text-white">{user?.username || "Not set"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-[rgba(255,255,255,0.03)] p-4">
            <Calendar className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Member Since</p>
              <p className="text-sm text-white">{createdDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-[rgba(255,255,255,0.03)] p-4">
            <Shield className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Account Type</p>
              <p className="text-sm text-white">
                {user?.is_superuser ? "Admin" : "Standard User"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0a0a0e]/60 p-6">
        <h2 className="mb-4 text-lg font-medium text-white">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="/dashboard/api-keys"
            className="flex items-center gap-3 rounded-lg bg-[rgba(255,255,255,0.03)] p-4 transition-colors hover:bg-[rgba(255,255,255,0.06)]"
          >
            <Key className="h-5 w-5 text-cyan-400" />
            <div>
              <p className="text-sm font-medium text-white">API Keys</p>
              <p className="text-xs text-slate-500">Manage your API keys</p>
            </div>
          </a>
          <a
            href="/dashboard/budgets"
            className="flex items-center gap-3 rounded-lg bg-[rgba(255,255,255,0.03)] p-4 transition-colors hover:bg-[rgba(255,255,255,0.06)]"
          >
            <Shield className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-white">Budgets</p>
              <p className="text-xs text-slate-500">Set spending limits</p>
            </div>
          </a>
          <a
            href="/dashboard/webhooks"
            className="flex items-center gap-3 rounded-lg bg-[rgba(255,255,255,0.03)] p-4 transition-colors hover:bg-[rgba(255,255,255,0.06)]"
          >
            <Bell className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-sm font-medium text-white">Webhooks</p>
              <p className="text-xs text-slate-500">Configure notifications</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
