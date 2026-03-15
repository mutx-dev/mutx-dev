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
  X
} from "lucide-react";
import { Card } from "@/components/ui/Card";

type Webhook = {
  id: string;
  url: string;
  name: string;
  events: string[];
  active: boolean;
  created_at: string;
  updated_at?: string;
};

export default function WebhooksPageClient() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [formData, setFormData] = useState({ url: "", events: "", name: "", active: true });
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWebhooks();
  }, []);

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
          is_active: formData.active,
          url: formData.url,
          name: formData.name,
          events: formData.events.split(",").map(e => e.trim()).filter(Boolean)
        })
      });
      
      if (!res.ok) throw new Error("Failed to save webhook");
      
      setShowForm(false);
      setEditingWebhook(null);
      setFormData({ url: "", events: "", name: "", active: true });
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
      name: webhook.name || "",
      events: webhook.events.join(", "),
      active: webhook.active
    });
    setShowForm(true);
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

      {!showForm && webhooks.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => { setShowForm(true); setEditingWebhook(null); setFormData({ url: "", events: "", name: "", active: true }); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Webhook
          </button>
        </div>
      )}

      {showForm && (
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
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://your-server.com/webhook"
                className="w-full px-3 py-2 border rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Webhook"
                className="w-full px-3 py-2 border rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Events (comma-separated)</label>
              <input
                type="text"
                value={formData.events}
                onChange={e => setFormData({ ...formData, events: e.target.value })}
                placeholder="agent.started, deployment.finished"
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            {editingWebhook && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="active" className="text-sm font-medium">Active</label>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingWebhook(null); }}
                className="px-4 py-2 border rounded-md hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {webhooks.length === 0 ? (
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
        <div className="space-y-4">
          {webhooks.map(webhook => (
            <Card key={webhook.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  {webhook.name && (
                    <p className="font-medium text-foreground">{webhook.name}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {webhook.url}
                    </code>
                    {webhook.active ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {webhook.events.map(event => (
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
      )}
    </div>
  );
}
