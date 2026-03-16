"use client";

import { useEffect, useState } from "react";
import {
  Plus,
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
} from "lucide-react";
import { Card } from "@/components/ui/Card";

type WebhookDelivery = {
  id: string;
  event: string;
  payload: string;
  status_code: number | null;
  success: boolean;
  error_message: string | null;
  attempts: number;
  created_at: string;
  delivered_at: string | null;
};

type Webhook = {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
};

export default function WebhooksPageClient() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [viewingDeliveries, setViewingDeliveries] = useState<Webhook | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);
  const [formData, setFormData] = useState({ url: "", events: "", is_active: true });
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  useEffect(() => {
    if (viewingDeliveries) {
      fetchDeliveries(viewingDeliveries.id);
    }
  }, [viewingDeliveries]);

  async function fetchWebhooks() {
    try {
      setLoading(true);
      const res = await fetch("/api/webhooks");
      if (!res.ok) throw new Error("Failed to fetch webhooks");
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDeliveries(webhookId: string) {
    try {
      setLoadingDeliveries(true);
      const res = await fetch(`/api/webhooks/${webhookId}/deliveries`);
      if (!res.ok) throw new Error("Failed to fetch deliveries");
      const data = await res.json();
      setDeliveries(data.deliveries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingDeliveries(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const method = editingWebhook ? "PATCH" : "POST";
      const url = editingWebhook
        ? `/api/webhooks/${editingWebhook.id}`
        : "/api/webhooks";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: formData.is_active,
          url: formData.url,
          events: formData.events.split(",").map((e) => e.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("Failed to save webhook");

      setShowForm(false);
      setEditingWebhook(null);
      setFormData({ url: "", events: "", is_active: true });
      fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete webhook");
      fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function handleTest(id: string) {
    setTestingId(id);
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to test webhook");
      alert("Test event sent!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setTestingId(null);
    }
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

      {webhooks.length === 0 && !showForm && !viewingDeliveries ? (
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
            {webhooks.map((webhook) => (
              <Card key={webhook.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {webhook.url}
                      </code>
                      {webhook.is_active ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
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
                      Created {new Date(webhook.created_at).toLocaleString()}
                    </p>
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
            ))}
          </div>
        )
      )}
    </div>
  );
}
