"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, RefreshCcw, Trash2 } from "lucide-react";

import { ApiRequestError, normalizeCollection, readJson } from "@/components/app/http";
import {
  getApiKeyLastUsed,
  getApiKeyLifecycleState,
  getApiKeyReadinessSignal,
  isApiKeyUsable,
} from "@/components/app/operatorReadiness";
import {
  LiveAuthRequired,
  LiveEmptyState,
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

import type { components } from "@/app/types/api";

type ApiKeyCreateResponse = components["schemas"]["APIKeyCreateResponse"];
type ApiKeyRecord = components["schemas"]["APIKeyResponse"] & {
  description?: string | null;
  is_active?: boolean;
  key_prefix?: string | null;
  last_used_at?: string | null;
  scopes?: string[];
  status?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAuthError(error: unknown) {
  return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
}

function isApiKeyCreateResponse(value: unknown): value is ApiKeyCreateResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.key === "string" &&
    typeof value.created_at === "string"
  );
}

function maskKeyId(id: string) {
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

function sortKeys(keys: ApiKeyRecord[]) {
  return [...keys].sort((left, right) => {
    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
    return rightTime - leftTime;
  });
}

export function ApiKeysPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("Operator key");
  const [revealedKey, setRevealedKey] = useState<ApiKeyCreateResponse | null>(null);
  const [copied, setCopied] = useState(false);

  async function fetchKeys() {
    const payload = await readJson<unknown>("/api/api-keys");
    return sortKeys(
      normalizeCollection<ApiKeyRecord>(payload, ["items", "keys", "api_keys", "data"]),
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setAuthRequired(false);
      setLoadError(null);

      try {
        const nextKeys = await fetchKeys();
        if (!cancelled) {
          setKeys(nextKeys);
          setLoading(false);
        }
      } catch (loadError) {
        if (cancelled) return;

        if (isAuthError(loadError)) {
          setAuthRequired(true);
        } else {
          setLoadError(loadError instanceof Error ? loadError.message : "Failed to load API keys");
        }
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeKeys = useMemo(() => keys.filter((key) => isApiKeyUsable(key)), [keys]);
  const recentlyUsedKeys = useMemo(
    () =>
      keys.filter((key) => {
        const lastUsed = getApiKeyLastUsed(key);
        if (!lastUsed) return false;
        const millis = new Date(lastUsed).getTime();
        return !Number.isNaN(millis) && millis >= Date.now() - 7 * 86_400_000;
      }),
    [keys],
  );
  const expiringSoon = useMemo(
    () => activeKeys.filter((key) => getApiKeyReadinessSignal(key)?.label === "expires soon"),
    [activeKeys],
  );
  const attentionKeys = useMemo(
    () =>
      activeKeys.filter((key) => {
        const readiness = getApiKeyReadinessSignal(key);
        return Boolean(readiness && readiness.status !== "success");
      }),
    [activeKeys],
  );

  async function refreshKeys() {
    const nextKeys = await fetchKeys();
    setKeys(nextKeys);
  }

  async function handleCreateKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = newKeyName.trim();
    if (!trimmedName) return;

    setPendingAction("create");
    setActionError(null);
    setCopied(false);

    try {
      const payload = await readJson<unknown>("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!isApiKeyCreateResponse(payload)) {
        throw new Error("API key creation did not return a one-time secret.");
      }

      setRevealedKey(payload);
      setNewKeyName("Operator key");
      await refreshKeys();
    } catch (actionError) {
      if (isAuthError(actionError)) {
        setAuthRequired(true);
      } else {
        setActionError(actionError instanceof Error ? actionError.message : "Failed to create API key");
      }
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRotateKey(keyId: string) {
    setPendingAction(`rotate:${keyId}`);
    setActionError(null);
    setCopied(false);

    try {
      const payload = await readJson<unknown>(`/api/api-keys/${keyId}/rotate`, {
        method: "POST",
      });

      if (!isApiKeyCreateResponse(payload)) {
        throw new Error("Key rotation did not return a replacement secret.");
      }

      setRevealedKey(payload);
      await refreshKeys();
    } catch (actionError) {
      if (isAuthError(actionError)) {
        setAuthRequired(true);
      } else {
        setActionError(actionError instanceof Error ? actionError.message : "Failed to rotate API key");
      }
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRevokeKey(keyId: string) {
    setPendingAction(`revoke:${keyId}`);
    setActionError(null);

    try {
      await readJson<unknown>(`/api/api-keys/${keyId}`, {
        method: "DELETE",
      });
      await refreshKeys();
    } catch (actionError) {
      if (isAuthError(actionError)) {
        setAuthRequired(true);
      } else {
        setActionError(actionError instanceof Error ? actionError.message : "Failed to revoke API key");
      }
    } finally {
      setPendingAction(null);
    }
  }

  async function copyRevealedKey() {
    if (!revealedKey) return;

    try {
      await navigator.clipboard.writeText(revealedKey.key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch (copyError) {
      setActionError(copyError instanceof Error ? copyError.message : "Failed to copy API key");
    }
  }

  if (loading) return <LiveLoading title="API Keys" />;
  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to create, rotate, revoke, and inspect API keys."
      />
    );
  }
  if (loadError) return <LiveErrorState title="API key surface unavailable" message={loadError} />;

  return (
    <div className="space-y-4">
      <LiveKpiGrid>
        <LiveStatCard
          label="Active keys"
          value={String(activeKeys.length)}
          detail={`${keys.length} total keys are visible in the operator ledger.`}
          status={asDashboardStatus(activeKeys.length > 0 ? "healthy" : "idle")}
        />
        <LiveStatCard
          label="Seen this week"
          value={String(recentlyUsedKeys.length)}
          detail="Keys with a recent `last used` signal in the last 7 days."
        />
        <LiveStatCard
          label="Attention needed"
          value={String(attentionKeys.length)}
          detail={`Includes ${expiringSoon.length} key${expiringSoon.length === 1 ? "" : "s"} in the 7-day rotation window.`}
          status={asDashboardStatus(attentionKeys.length > 0 ? "warning" : "healthy")}
        />
        <LiveStatCard
          label="One-time reveal"
          value={revealedKey ? "ready" : "idle"}
          detail={
            revealedKey
              ? "A newly created or rotated secret is available to copy once."
              : "New secrets appear here immediately after create or rotate."
          }
          status={asDashboardStatus(revealedKey ? "running" : "idle")}
        />
      </LiveKpiGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
        <div className="space-y-4">
          <LivePanel title="Key issuance" meta="create + reveal">
            {actionError ? (
              <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-3 text-sm text-rose-100">
                {actionError}
              </div>
            ) : null}

            <form onSubmit={handleCreateKey} className="space-y-3">
              <div>
                <label
                  htmlFor="new-api-key-name"
                  className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  Key name
                </label>
                <input
                  id="new-api-key-name"
                  value={newKeyName}
                  onChange={(event) => setNewKeyName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  placeholder="Operator key"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={pendingAction !== null || newKeyName.trim().length === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <KeyRound className="h-4 w-4" />
                  {pendingAction === "create" ? "Creating..." : "Create key"}
                </button>
                <p className="text-sm text-slate-400">
                  New secrets are only revealed once, immediately after creation or rotation.
                </p>
              </div>
            </form>

            {revealedKey ? (
              <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{revealedKey.name}</p>
                    <p className="mt-1 text-xs text-emerald-100/80">
                      Copy this secret now. The dashboard will not show it again after you leave this state.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyRevealedKey}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-emerald-100 transition hover:bg-emerald-400/10"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                  <code className="block break-all text-xs text-white">{revealedKey.key}</code>
                </div>
              </div>
            ) : null}
          </LivePanel>

          <LivePanel title="Key registry" meta={`${keys.length} records · ${attentionKeys.length} attention`}>
            {keys.length === 0 ? (
              <LiveEmptyState
                title="No API keys provisioned yet"
                message="Create the first operator key here to unlock the non-browser access flow."
              />
            ) : (
              <div className="space-y-3">
                {keys.map((key) => {
                  const lastUsed = getApiKeyLastUsed(key);
                  const lifecycle = getApiKeyLifecycleState(key);
                  const readiness = getApiKeyReadinessSignal(key);
                  const active = lifecycle.label === "active";

                  return (
                    <div key={key.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-white">{key.name}</p>
                            <StatusBadge status={lifecycle.status} label={lifecycle.label} />
                            {readiness ? <StatusBadge status={readiness.status} label={readiness.label} /> : null}
                          </div>
                          <p className="mt-2 font-mono text-xs text-slate-500">{maskKeyId(key.id)}</p>
                          <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                            <div>created {formatDateTime(key.created_at)}</div>
                            <div>
                              last used {lastUsed ? formatRelativeTime(lastUsed) : "never"}
                            </div>
                            <div>expires {key.expires_at ? formatDateTime(key.expires_at) : "no expiry"}</div>
                            <div>operator health {readiness?.detail ?? lifecycle.detail}</div>
                          </div>
                        </div>

                        {active ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleRotateKey(key.id)}
                              disabled={pendingAction !== null}
                              className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-cyan-200 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <RefreshCcw className="h-3.5 w-3.5" />
                              {pendingAction === `rotate:${key.id}` ? "Rotating..." : "Rotate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleRevokeKey(key.id)}
                              disabled={pendingAction !== null}
                              className="inline-flex items-center gap-2 rounded-lg border border-rose-400/30 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-rose-200 transition hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {pendingAction === `revoke:${key.id}` ? "Revoking..." : "Revoke"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </LivePanel>
        </div>

        <LivePanel title="Lifecycle notes" meta="operator access">
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-white">Creation and rotation are live</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                This route now owns create, rotate, and revoke actions directly instead of bouncing into the broader security page.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-white">Secrets are one-time reveal only</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The secret value is shown exactly once after create or rotate. The ledger keeps metadata and audit posture, not reusable plaintext secrets.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-white">Audit records stay visible</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Revoked or expired keys remain in the registry so operators can verify lifecycle events without losing history.
              </p>
            </div>
          </div>
        </LivePanel>
      </div>
    </div>
  );
}
