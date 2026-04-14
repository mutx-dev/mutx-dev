"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Play,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Webhook,
  X,
  Eye,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { readJson, writeJson } from "@/components/app/http";
import {
  LiveAuthRequired,
  LiveKpiGrid,
  LivePanel,
  LiveStatCard,
  formatDateTime,
  formatRelativeTime,
} from "@/components/dashboard/livePrimitives";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  describeWebhookHealth,
  normalizeWebhookCollection,
  normalizeWebhookDeliveryCollection,
  summarizeWebhookFleet,
  type WebhookDeliveryRecord,
  type WebhookLifecycleRecord,
} from "@/lib/operatorLifecycle";

type Webhook = WebhookLifecycleRecord;
type WebhookDelivery = WebhookDeliveryRecord;

export default function WebhooksPageClient() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliverySnapshots, setDeliverySnapshots] = useState<Record<string, WebhookDelivery[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliverySummaryError, setDeliverySummaryError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [viewingDeliveries, setViewingDeliveries] = useState<Webhook | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);
  const [formData, setFormData] = useState({ url: "", events: "", is_active: true });
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  useEffect(() => {
    if (viewingDeliveries) {
      fetchDeliveries(viewingDeliveries.id);
    }
  }, [viewingDeliveries]);

  // Detect Mac OS
  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter webhooks based on search query
  const filteredWebhooks = searchQuery
    ? webhooks.filter(w => 
        w.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.events.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : webhooks;
  const fleetSummary = useMemo(
    () => summarizeWebhookFleet(webhooks, deliverySnapshots),
    [deliverySnapshots, webhooks],
  );

  const hasAuthError = Boolean(error && /unauthorized|forbidden|auth|token|sign in|login/i.test(error));

  async function loadDeliverySnapshots(nextWebhooks: Webhook[]) {
    if (nextWebhooks.length === 0) {
      setDeliverySnapshots({});
      setDeliverySummaryError(null);
      return;
    }

    let failed = 0;
    const pairs = await Promise.all(
      nextWebhooks.map(async (webhook) => {
        try {
          const payload = await readJson<unknown>(`/api/webhooks/${webhook.id}/deliveries?limit=3`);
          return [webhook.id, normalizeWebhookDeliveryCollection(payload)] as const;
        } catch {
          failed += 1;
          return [webhook.id, []] as const;
        }
      }),
    );

    setDeliverySnapshots(Object.fromEntries(pairs));
    setDeliverySummaryError(
      failed > 0 ? "Some delivery health snapshots could not be loaded from the live route." : null,
    );
  }

  async function fetchWebhooks() {
    try {
      setLoading(true);
      setError(null);
      const data = await readJson<unknown>("/api/webhooks");
      const nextWebhooks = normalizeWebhookCollection(data);
      setWebhooks(nextWebhooks);
      await loadDeliverySnapshots(nextWebhooks);
    } catch (err) {
      setWebhooks([]);
      setDeliverySnapshots({});
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDeliveries(webhookId: string) {
    try {
      setLoadingDeliveries(true);
      setError(null);
      const data = await readJson<unknown>(`/api/webhooks/${webhookId}/deliveries`);
      setDeliveries(normalizeWebhookDeliveryCollection(data));
    } catch (err) {
      setDeliveries([]);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingDeliveries(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const method = editingWebhook ? "PATCH" : "POST";
      const url = editingWebhook
        ? `/api/webhooks/${editingWebhook.id}`
        : "/api/webhooks";

      await writeJson<unknown>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: formData.is_active,
          url: formData.url,
          events: formData.events.split(",").map((e) => e.trim()).filter(Boolean),
        }),
      });

      setShowForm(false);
      setEditingWebhook(null);
      setFormData({ url: "", events: "", is_active: true });
      await fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      setError(null);
      await writeJson<unknown>(`/api/webhooks/${id}`, { method: "DELETE" });
      await fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function handleTest(id: string) {
    setTestingId(id);
    setError(null);
    try {
      await writeJson<unknown>(`/api/webhooks/${id}/test`, { method: "POST" });
      alert("Test event sent!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setTestingId(null);
    }
  }

  async function handleCopyId(id: string) {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function startEdit(webhook: Webhook) {
    setEditingWebhook(webhook);
    setFormData({
      url: webhook.url,
      events: webhook.events.join(", "),
      is_active: webhook.is_active,
    });
    setShowForm(true);
  }

  function formatJson(payload: string): string {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!viewingDeliveries && !hasAuthError && !error ? (
        <>
          <LiveKpiGrid>
            <LiveStatCard
              label="Active routes"
              value={String(fleetSummary.active)}
              detail={`${webhooks.length} total webhook endpoints are visible in the operator surface.`}
              status={fleetSummary.active > 0 ? "success" : "idle"}
            />
            <LiveStatCard
              label="Healthy latest delivery"
              value={String(fleetSummary.healthy)}
              detail="Active webhook routes whose latest recorded delivery completed successfully."
              status={fleetSummary.healthy > 0 ? "success" : "idle"}
            />
            <LiveStatCard
              label="Needs attention"
              value={String(fleetSummary.attention)}
              detail="Active routes whose latest recorded delivery failed and need operator follow-through."
              status={fleetSummary.attention > 0 ? "error" : "success"}
            />
            <LiveStatCard
              label="No deliveries yet"
              value={String(fleetSummary.noDeliveries)}
              detail="Active routes without a recorded delivery attempt in the current history lane."
              status={fleetSummary.noDeliveries > 0 ? "warning" : "success"}
            />
          </LiveKpiGrid>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
            <LivePanel title="Delivery posture" meta="live health">
              {deliverySummaryError ? (
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-3 text-sm text-amber-100">
                  {deliverySummaryError}
                </div>
              ) : null}
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-sm font-medium text-white">Latest-delivery health only</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    This surface does not invent uptime scores. It classifies each route from the latest recorded delivery,
                    plus the route&apos;s current active or inactive state.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-sm font-medium text-white">Delivery history stays drill-down first</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Summary badges stay compact here, while the full payload, error, and retry details remain inside each
                    webhook&apos;s delivery history drawer.
                  </p>
                </div>
              </div>
            </LivePanel>

            <LivePanel title="Lifecycle parity" meta="dashboard + CLI">
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-sm font-medium text-white">Same live routes, different operator shells</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    The dashboard health badges map to the same live delivery and route-state data you can inspect with
                    `mutx webhooks get`, `mutx webhooks deliveries`, and `mutx webhooks list`.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-sm font-medium text-white">Compare route health with key readiness</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Use the{" "}
                    <Link href="/dashboard/api-keys" className="text-cyan-300 underline decoration-cyan-400/40 underline-offset-4">
                      API key registry
                    </Link>{" "}
                    to correlate expiring or stale credentials with outbound delivery behavior before rotating or revoking access.
                  </p>
                </div>
              </div>
            </LivePanel>
          </div>
        </>
      ) : null}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-destructive/20 rounded"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {viewingDeliveries && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Delivery History</h2>
            <button
              onClick={() => {
                setViewingDeliveries(null);
                setDeliveries([]);
                setExpandedDelivery(null);
              }}
              className="p-2 hover:bg-accent rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {viewingDeliveries.url}
          </p>
          {loadingDeliveries ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : deliveries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No deliveries yet
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="border rounded-md overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedDelivery(
                        expandedDelivery === delivery.id ? null : delivery.id
                      )
                    }
                    className="w-full flex items-center justify-between p-3 hover:bg-accent/50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {delivery.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-mono text-sm">{delivery.event}</span>
                      {delivery.status_code && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            delivery.status_code >= 200 && delivery.status_code < 300
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {delivery.status_code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(delivery.created_at).toLocaleString()}
                      </span>
                      {expandedDelivery === delivery.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                  {expandedDelivery === delivery.id && (
                    <div className="p-3 border-t bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-2">
                        Payload:
                      </p>
                      <pre className="text-xs bg-black/50 p-3 rounded overflow-x-auto max-h-64">
                        {formatJson(delivery.payload)}
                      </pre>
                      {delivery.error_message && (
                        <p className="text-xs text-red-400 mt-2">
                          Error: {delivery.error_message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

            {!showForm && !viewingDeliveries && webhooks.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isMac ? "Search webhooks... (⌘K)" : "Search webhooks... (Ctrl+K)"}
            className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      )}

      {!showForm && !viewingDeliveries && filteredWebhooks.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingWebhook(null);
              setFormData({ url: "", events: "", is_active: true });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Webhook
          </button>
        </div>
      )}

      {showForm && !viewingDeliveries && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingWebhook ? "Edit Webhook" : "Add New Webhook"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://your-server.com/webhook"
                className="w-full px-3 py-2 border rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Events (comma-separated)
              </label>
              <input
                type="text"
                value={formData.events}
                onChange={(e) =>
                  setFormData({ ...formData, events: e.target.value })
                }
                placeholder="agent.started, deployment.finished"
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            {editingWebhook && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="active" className="text-sm font-medium">
                  Active
                </label>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingWebhook(null);
                }}
                className="px-4 py-2 border rounded-md hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {hasAuthError && !showForm && !viewingDeliveries ? (
        <LiveAuthRequired
          title="Operator session required"
          message="Sign in to load webhook routes, test deliveries, and replay history from the live event surface."
        />
      ) : filteredWebhooks.length === 0 && !showForm && !viewingDeliveries ? (
        <Card className="p-12 text-center">
          <Webhook className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
          <p className="text-muted-foreground mb-4">
            Add a webhook to receive real-time notifications
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            Add Your First Webhook
          </button>
        </Card>
      ) : (
        !viewingDeliveries && (
          <div className="space-y-4">
            {filteredWebhooks.map((webhook) => {
              const health = describeWebhookHealth(webhook, deliverySnapshots[webhook.id] ?? [])

              return (
                <Card key={webhook.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {webhook.url}
                      </code>
                      <StatusBadge
                        status={webhook.is_active ? "success" : "idle"}
                        label={webhook.is_active ? "active" : "inactive"}
                      />
                      <StatusBadge status={health.tone} label={health.label} />
                      <button
                        onClick={() => handleCopyId(webhook.id)}
                        className="flex items-center gap-1 rounded p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                        title="Copy webhook ID"
                      >
                        {copiedId === webhook.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {webhook.events.map((event) => (
                        <span
                          key={event}
                          className="text-xs bg-secondary px-2 py-0.5 rounded"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDateTime(webhook.created_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Latest attempt {health.latestAttemptAt ? formatRelativeTime(health.latestAttemptAt) : "not recorded"}
                    </p>
                    {health.statusCode ? (
                      <p className="text-xs text-muted-foreground">
                        Last status {health.statusCode}
                        {health.attempts && health.attempts > 1 ? ` · attempts ${health.attempts}` : ""}
                      </p>
                    ) : null}
                    {health.errorMessage ? (
                      <p className="text-xs text-red-400">
                        {health.errorMessage}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingDeliveries(webhook)}
                      className="p-2 hover:bg-accent rounded-md"
                      title="View delivery history"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleTest(webhook.id)}
                      disabled={testingId === webhook.id}
                      className="p-2 hover:bg-accent rounded-md disabled:opacity-50"
                      title="Test webhook"
                    >
                      {testingId === webhook.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(webhook)}
                      className="p-2 hover:bg-accent rounded-md"
                      title="Edit webhook"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id)}
                      className="p-2 hover:bg-accent rounded-md text-destructive"
                      title="Delete webhook"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                </Card>
              )
            })}
          </div>
        )
      )}
    </div>
  );
}
