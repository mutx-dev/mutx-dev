"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Edit2,
  Loader2,
  Play,
  Plus,
  Trash2,
  Webhook,
  X,
} from "lucide-react";

import { Card } from "@/components/ui/Card";

type WebhookRecord = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  updated_at?: string;
};

export default function WebhooksPageClient() {
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookRecord | null>(null);
  const [formData, setFormData] = useState({ url: "", events: "" });
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    void fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/webhooks", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch webhooks");
      const payload = await response.json();
      const list = Array.isArray(payload) ? payload : payload.webhooks;
      setWebhooks(Array.isArray(list) ? list : []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingWebhook(null);
    setShowForm(true);
    setFormData({ url: "", events: "" });
  }

  function startEdit(webhook: WebhookRecord) {
    setEditingWebhook(webhook);
    setShowForm(true);
    setFormData({ url: webhook.url, events: webhook.events.join(", ") });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const method = editingWebhook ? "PATCH" : "POST";
      const url = editingWebhook ? `/api/webhooks/${editingWebhook.id}` : "/api/webhooks";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: formData.url,
          events: formData.events
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) throw new Error("Failed to save webhook");

      setNotice(editingWebhook ? "Webhook updated" : "Webhook created");
      setShowForm(false);
      setEditingWebhook(null);
      setFormData({ url: "", events: "" });
      await fetchWebhooks();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete webhook");
      setNotice("Webhook deleted");
      await fetchWebhooks();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unknown error");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTest(id: string) {
    setTestingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to test webhook");
      setNotice("Test event sent");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unknown error");
    } finally {
      setTestingId(null);
    }
  }

  async function copyId(id: string) {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  }

  function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleString();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-14">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Webhook endpoints</h2>
          <p className="mt-1 text-sm text-slate-400">
            Configure and test event delivery targets for external automation.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-300 px-4 py-2 text-sm font-semibold text-[#03111d] transition hover:bg-cyan-200"
        >
          <Plus className="h-4 w-4" />
          Add endpoint
        </button>
      </div>

      {notice ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      {showForm ? (
        <Card className="border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Webhook editor</p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {editingWebhook ? "Edit endpoint" : "Create endpoint"}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingWebhook(null);
              }}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-slate-300 hover:bg-white/[0.06]"
              aria-label="Close webhook form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Target URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(inputEvent) => setFormData((current) => ({ ...current, url: inputEvent.target.value }))}
                placeholder="https://your-service.com/hooks/mutx"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/40 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Events</label>
              <input
                type="text"
                value={formData.events}
                onChange={(inputEvent) => setFormData((current) => ({ ...current, events: inputEvent.target.value }))}
                placeholder="deployment.created, run.completed"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/40 focus:outline-none"
              />
              <p className="mt-2 text-xs text-slate-500">Comma-separated event names.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-[#03111d] transition hover:bg-cyan-200 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {editingWebhook ? "Save changes" : "Create endpoint"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingWebhook(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.06]"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      ) : null}

      {webhooks.length === 0 ? (
        <Card className="border border-white/10 bg-white/[0.01] p-12 text-center">
          <Webhook className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-4 text-lg font-semibold text-white">No webhook endpoints</h3>
          <p className="mt-2 text-sm text-slate-400">
            Add an endpoint to receive deployment, run, and control-plane events.
          </p>
          <button
            type="button"
            onClick={openCreateForm}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-[#03111d] hover:bg-cyan-200"
          >
            <Plus className="h-4 w-4" />
            Create first endpoint
          </button>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => {
            const isTesting = testingId === webhook.id;
            const isDeleting = deletingId === webhook.id;

            return (
              <Card key={webhook.id} className="border border-white/10 bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-slate-300">
                        {webhook.url}
                      </code>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                          webhook.active
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                            : "border-amber-400/30 bg-amber-400/10 text-amber-200"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${webhook.active ? "bg-emerald-300" : "bg-amber-300"}`} />
                        {webhook.active ? "active" : "paused"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {webhook.events.map((eventName) => (
                        <span
                          key={eventName}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-400"
                        >
                          {eventName}
                        </span>
                      ))}
                    </div>

                    <p className="mt-3 text-xs text-slate-500">Created {formatDate(webhook.created_at)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => copyId(webhook.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06]"
                    >
                      {copiedId === webhook.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === webhook.id ? "Copied" : "ID"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTest(webhook.id)}
                      disabled={isTesting}
                      className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1.5 text-xs text-cyan-200 hover:bg-cyan-300/15 disabled:opacity-60"
                    >
                      {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                      Test
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(webhook)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06]"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(webhook.id)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-400/25 bg-rose-400/10 px-2.5 py-1.5 text-xs text-rose-200 hover:bg-rose-400/15 disabled:opacity-60"
                    >
                      {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
