"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  CheckCircle2,
  Copy,
  Database,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  UserCircle2,
  XCircle,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { type components } from "@/app/types/api";

type User = components["schemas"]["UserResponse"];
type Agent = components["schemas"]["AgentResponse"];
type Deployment = components["schemas"]["DeploymentResponse"];
type ApiKey = components["schemas"]["APIKeyResponse"];
type Health = components["schemas"]["HealthResponse"];
type CreateKeyResponse = components["schemas"]["APIKeyCreateResponse"];

async function readJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, { ...init, cache: "no-store" });
  const payload = await response
    .json()
    .catch(() => ({ detail: "Request failed" }));

  if (!response.ok) {
    throw new Error(payload.detail || payload.error || "Request failed");
  }

  return payload as T;
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "running" || status === "healthy"
      ? "bg-emerald-300"
      : status === "failed" || status === "error" || status === "unhealthy"
        ? "bg-rose-300"
        : "bg-amber-300";

  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
}

export function AppDashboardClient() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [apiKeyName, setApiKeyName] = useState("App dashboard key");
  const [apiKeyDays, setApiKeyDays] = useState("30");
  const [createdKey, setCreatedKey] = useState<CreateKeyResponse | null>(null);

  const summary = useMemo(
    () => [
      { label: "Agents", value: String(agents.length), icon: Bot },
      { label: "Deployments", value: String(deployments.length), icon: Rocket },
      { label: "API Keys", value: String(apiKeys.length), icon: KeyRound },
      { label: "Health", value: health?.status || "unknown", icon: Activity },
    ],
    [agents.length, deployments.length, apiKeys.length, health?.status],
  );

  async function loadDashboard() {
    const [nextUser, nextHealth, nextAgents, nextDeployments, nextKeys] =
      await Promise.all([
        readJson<User>("/api/auth/me"),
        readJson<Health>("/api/dashboard/health"),
        readJson<Agent[]>("/api/dashboard/agents"),
        readJson<Deployment[]>("/api/dashboard/deployments"),
        readJson<ApiKey[]>("/api/api-keys"),
      ]);

    setUser(nextUser);
    setHealth(nextHealth);
    setAgents(nextAgents);
    setDeployments(nextDeployments);
    setApiKeys(nextKeys);
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await loadDashboard();
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCreatedKey(null);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      await readJson(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? { email, password }
            : { email, password, name: name || email.split("@")[0] },
        ),
      });

      await loadDashboard();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Authentication failed",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError("");

    try {
      await loadDashboard();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Refresh failed",
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setError("");

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setAgents([]);
      setDeployments([]);
      setApiKeys([]);
      setHealth(null);
      setCreatedKey(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = await readJson<CreateKeyResponse>("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: apiKeyName,
          expires_in_days: Number(apiKeyDays) || undefined,
        }),
      });

      setCreatedKey(payload);
      await loadDashboard();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to create API key",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyKey() {
    if (!createdKey?.key) return;
    await navigator.clipboard.writeText(createdKey.key);
  }

  async function handleRevokeKey(keyId: string) {
    setLoading(true);
    setError("");

    try {
      await readJson(`/api/api-keys/${keyId}`, {
        method: "DELETE",
      });
      await loadDashboard();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to revoke API key",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRotateKey(keyId: string) {
    setLoading(true);
    setError("");

    try {
      const payload = await readJson<CreateKeyResponse>(`/api/api-keys/${keyId}/rotate`, {
        method: "POST",
      });
      setCreatedKey(payload);
      await loadDashboard();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to rotate API key",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="border border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3 text-cyan-400 mb-6">
            <UserCircle2 className="h-6 w-6" />
            <h2 className="text-xl font-semibold text-white">
              Operator Console
            </h2>
          </div>

          <div className="mt-5 inline-flex rounded-full border border-white/5 bg-white/[0.02] p-1 text-sm mb-6">
            {(["login", "register"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-full px-5 py-2 font-medium transition ${
                  mode === value
                    ? "bg-cyan-400/10 text-cyan-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {value === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === "register" ? (
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Operator name"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20 transition-all"
              />
            ) : null}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="operator@company.com"
              required
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20 transition-all"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full justify-center items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {mode === "login" ? "Authenticate" : "Initialize Account"}
            </button>
          </form>

          {error ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}
        </Card>

        <Card className="border border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3 text-cyan-400 mb-6">
            <Activity className="h-6 w-6" />
            <h2 className="text-xl font-semibold text-white">System Status</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Control Plane", route: "/auth/*", status: "Online" },
              { label: "Agent Mesh", route: "/agents", status: "Online" },
              { label: "Key Vault", route: "/api-keys", status: "Online" },
              {
                label: "Runtime Sync",
                route: "/deployments",
                status: "Online",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm"
              >
                <div>
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-1 font-[family:var(--font-mono)]">
                    {item.route}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">
            Logged in
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Welcome back, {user.name}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {user.email} · plan: {user.plan} · email verified:{" "}
            {user.is_email_verified ? "yes" : "no"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm transition hover:border-cyan-300/30 hover:text-white"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm transition hover:border-rose-300/30 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          <XCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.map(({ label, value, icon: Icon }) => (
          <Card
            key={label}
            className="p-5 border border-white/5 bg-white/[0.01]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] text-cyan-400">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {label}
              </p>
            </div>

            <div className="flex items-center gap-3 text-white">
              {label === "Health" ? <StatusDot status={value} /> : null}
              <p className="text-3xl font-semibold capitalize tracking-tight">
                {value}
              </p>
            </div>
            {label === "Health" ? (
              <p className="mt-2 text-xs text-slate-500 font-[family:var(--font-mono)]">
                database: {health?.database || "unknown"}
              </p>
            ) : null}
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="border border-white/5 bg-white/[0.01] p-0 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3 text-cyan-400">
              <Bot className="h-5 w-5" />
              <h3 className="text-lg font-semibold text-white tracking-tight">
                Agent Fleet
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.03] px-2 py-1 text-xs font-medium text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>{" "}
              Live sync
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.02] text-slate-400 text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 font-medium">Identifier</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">
                    Provisioned
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {refreshing ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      Refreshing live agent data…
                    </td>
                  </tr>
                ) : agents.length ? (
                  agents.map((agent) => (
                    <tr
                      key={agent.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-200">
                          {agent.name}
                        </p>
                        <p className="text-xs text-slate-500 font-[family:var(--font-mono)] mt-1">
                          {agent.id.split("-")[0]}
                        </p>
                      </td>
                      <td className="px-6 py-4 capitalize">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border border-white/5 px-2.5 py-0.5 text-xs font-medium ${agent.status === "running" ? "bg-emerald-400/10 text-emerald-400" : "bg-white/5 text-slate-300"}`}
                        >
                          <StatusDot status={agent.status} />
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-right font-[family:var(--font-mono)] text-xs">
                        {formatDate(agent.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No agents found for this account yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border border-white/5 bg-white/[0.01]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-emerald-400">
                <Rocket className="h-5 w-5" />
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  Active Deployments
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {refreshing ? (
                <div className="rounded-xl border border-white/5 border-dashed p-6 text-center text-sm text-slate-500">
                  Refreshing deployment state…
                </div>
              ) : deployments.length ? (
                deployments.map((deployment) => (
                  <div
                    key={deployment.id}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-emerald-400/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-[family:var(--font-mono)] text-xs text-slate-300">
                        {deployment.id.split("-")[0]}
                      </p>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                        {deployment.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <p>
                        Agent:{" "}
                        <span className="text-slate-300">
                          {deployment.agent_id.split("-")[0]}
                        </span>
                      </p>
                      <p>
                        Replicas:{" "}
                        <span className="text-white font-medium">
                          {deployment.replicas}
                        </span>
                      </p>
                    </div>

                    {deployment.events?.length ? (
                      <div className="mt-3 border-t border-white/5 pt-3">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 uppercase tracking-wider">
                            Latest Event
                          </span>
                          <span className="text-slate-400 font-[family:var(--font-mono)]">
                            {formatDate(
                              deployment.events[deployment.events.length - 1]
                                .created_at,
                            )}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-emerald-400/80 truncate">
                          {
                            deployment.events[deployment.events.length - 1]
                              .event_type
                          }{" "}
                          →{" "}
                          {
                            deployment.events[deployment.events.length - 1]
                              .status
                          }
                        </p>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/5 border-dashed p-6 text-center text-sm text-slate-500">
                  No deployments found for this account yet.
                </div>
              )}
            </div>
          </Card>

          <Card className="border border-white/5 bg-white/[0.01]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-amber-400">
                <KeyRound className="h-5 w-5" />
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  API Keys
                </h3>
              </div>
            </div>

            <form onSubmit={handleCreateKey} className="mb-6 flex gap-2">
              <input
                value={apiKeyName}
                onChange={(event) => setApiKeyName(event.target.value)}
                placeholder="Key name..."
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/20 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-300 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Generate"
                )}
              </button>
            </form>

            {createdKey ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6 overflow-hidden rounded-lg border border-amber-400/30 bg-amber-400/10 p-4"
              >
                <p className="text-xs font-medium text-amber-200 mb-2">
                  New key generated
                </p>
                <div className="flex items-center gap-2 rounded bg-black/40 px-3 py-2">
                  <code className="text-xs text-white truncate flex-1">
                    {createdKey.key}
                  </code>
                  <button
                    type="button"
                    onClick={copyKey}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ) : null}

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {apiKeys.length ? (
                apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-slate-300">{apiKey.name}</p>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest ${apiKey.is_active ? "bg-emerald-400/10 text-emerald-300" : "bg-white/5 text-slate-400"}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${apiKey.is_active ? "bg-emerald-300" : "bg-slate-500"}`} />
                            {apiKey.is_active ? "Active" : "Revoked"}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-[11px] text-slate-500 font-[family:var(--font-mono)]">
                          <p>Created: {formatDate(apiKey.created_at)}</p>
                          <p>Last used: {formatDate(apiKey.last_used)}</p>
                          <p>Expires: {formatDate(apiKey.expires_at)}</p>
                        </div>
                      </div>
                      {apiKey.is_active ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRotateKey(apiKey.id)}
                            disabled={loading}
                            className="rounded border border-cyan-500/30 px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-cyan-300 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Rotate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeKey(apiKey.id)}
                            disabled={loading}
                            className="rounded border border-rose-500/30 px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-rose-300 transition hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Revoke
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-500 py-4">
                  No keys provisioned.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
