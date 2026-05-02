"use client";

import { useEffect, useState } from "react";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";

import { ApiRequestError, normalizeCollection, readJson } from "@/components/app/http";
import {
  LiveAuthRequired,
  LiveErrorState,
  LiveKpiGrid,
  LiveLoading,
  LivePanel,
  LiveStatCard,
  asDashboardStatus,
  formatDateTime,
  formatRelativeTime,
} from "@/components/dashboard/livePrimitives";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

type ApiKeyRecord = {
  id: string;
  name?: string;
  description?: string | null;
  key_prefix?: string | null;
  status?: string | null;
  scopes?: string[];
  created_at?: string | null;
  expires_at?: string | null;
  last_used_at?: string | null;
};

export function SecurityPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setAuthRequired(false);

      try {
        const response = await readJson<unknown>("/api/api-keys");
        if (!cancelled) {
          setKeys(normalizeCollection<ApiKeyRecord>(response, ["keys", "api_keys", "items", "data"]));
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (
            loadError instanceof ApiRequestError &&
            (loadError.status === 401 || loadError.status === 403)
          ) {
            setAuthRequired(true);
          } else {
            setError(loadError instanceof Error ? loadError.message : "Failed to load security state");
          }
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LiveLoading title="Security" />;
  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to inspect API keys, auth posture, and credential lifecycle."
      />
    );
  }
  if (error) return <LiveErrorState title="Security surface unavailable" message={error} />;

  const liveKeys = keys.filter((key) => !key.expires_at || new Date(key.expires_at).getTime() > Date.now());

  return (
    <div className="space-y-4">
      <LiveKpiGrid>
        <LiveStatCard
          label="Credentials"
          value={String(keys.length)}
          detail={`${liveKeys.length} appear active or unexpired.`}
          status={asDashboardStatus(liveKeys.length > 0 ? "healthy" : "idle")}
        />
        <LiveStatCard
          label="Boundary"
          value="Operator owned"
          detail="Auth and key state are held inside the product, not in a disconnected admin wall."
          status="success"
        />
      </LiveKpiGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <LivePanel title="Credential inventory" meta={`${keys.length} keys`}>
          <div className="space-y-3">
            {keys.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
                No API keys returned yet. Once operator credentials exist, rotation posture will show up here.
              </div>
            ) : (
              keys.map((key) => (
                <div key={key.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{key.name || key.key_prefix || key.id}</p>
                      <p className="mt-1 text-xs text-slate-500">{key.description || key.id}</p>
                    </div>
                    <StatusBadge status={asDashboardStatus(key.status || "idle")} label={key.status || "unknown"} />
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                    <div>created {formatDateTime(key.created_at)}</div>
                    <div>last used {key.last_used_at ? formatRelativeTime(key.last_used_at) : "never"}</div>
                    <div>expires {key.expires_at ? formatDateTime(key.expires_at) : "no expiry"}</div>
                    <div>scopes {(key.scopes ?? []).join(", ") || "default"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </LivePanel>

        <LivePanel title="Security posture" meta="workspace trust">
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
                <span className="text-sm font-medium">Owned credentials</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                MUTX keeps API keys and deployment actions in the same governance surface so rotation, ownership, and actionability stay connected.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-slate-300">
                <Lock className="h-4 w-4 text-cyan-300" />
                <span className="text-sm font-medium">Auth boundary</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Dashboard surfaces now fail honestly into auth-required state instead of rendering dead-end product shells.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-slate-300">
                <KeyRound className="h-4 w-4 text-cyan-300" />
                <span className="text-sm font-medium">Rotation posture</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Keys should rotate from the same product area teams use to deploy, replay, and recover.
              </p>
            </div>
          </div>
        </LivePanel>
      </div>
    </div>
  );
}
