"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Webhook, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Clock,
  X,
  Filter
} from "lucide-react";
import { Card } from "@/components/ui/Card";

type WebhookDetail = {
  id: string;
  url: string;
  name: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

type WebhookDelivery = {
  id: string;
  webhook_id: string;
  event: string;
  payload: string;
  status_code: number | null;
  success: boolean;
  error_message: string | null;
  attempts: number;
  created_at: string;
};

interface WebhookDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function WebhookDetailPage({ params }: WebhookDetailPageProps) {
  const router = useRouter();
  const [webhook, setWebhook] = useState<WebhookDetail | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "success" | "failed">("all");
  const [webhookId, setWebhookId] = useState<string>("");

  useEffect(() => { 
    params.then((p) => setWebhookId(p.id)); 
  }, [params]);

  useEffect(() => {
    if (!webhookId) return;
    async function fetchWebhook() {
      try {
        setLoading(true);
        const res = await fetch(`/api/webhooks/${webhookId}`);
        if (!res.ok) throw new Error("Failed to fetch webhook");
        const data = await res.json();
        setWebhook(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchWebhook();
  }, [webhookId]);

  useEffect(() => {
    if (!webhookId) return;
    async function fetchDeliveries() {
      try {
        setLoadingDeliveries(true);
        const queryParams = new URLSearchParams();
        if (filter === "success") queryParams.set("success", "true");
        if (filter === "failed") queryParams.set("success", "false");
        
        const res = await fetch(`/api/webhooks/${webhookId}/deliveries?${queryParams}`);
        if (!res.ok) throw new Error("Failed to fetch deliveries");
        const data = await res.json();
        setDeliveries(data.deliveries || data || []);
      } catch (err) {
        console.error("Failed to fetch deliveries:", err);
      } finally {
        setLoadingDeliveries(false);
      }
    }
    fetchDeliveries();
  }, [webhookId, filter]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error || !webhook) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
        {error || "Webhook not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push("/dashboard/webhooks")} 
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-400/10 text-purple-400">
          <Webhook className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">{webhook.name || "Unnamed Webhook"}</h1>
            {webhook.is_active ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-400">
                <AlertCircle className="h-3 w-3" /> Inactive
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Webhook className="h-5 w-5 text-purple-400" />
            Webhook Details
          </h2>
          <dl className="space-y-4">
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-slate-400">URL</dt>
              <dd className="text-sm text-slate-200 font-mono break-all">{webhook.url}</dd>
            </div>
            <div className="flex flex-col gap-2">
              <dt className="text-sm text-slate-400">Events</dt>
              <dd className="flex flex-wrap gap-1">
                {webhook.events.map(event => (
                  <span key={event} className="text-xs bg-secondary px-2 py-1 rounded">
                    {event}
                  </span>
                ))}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-400">ID</dt>
              <dd className="text-sm text-slate-200 font-mono">{webhook.id.slice(0, 8)}...</dd>
            </div>
          </dl>
        </Card>
        
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Clock className="h-5 w-5 text-purple-400" />
            Timestamps
          </h2>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-400">Created</dt>
              <dd className="text-sm text-slate-200">{formatDate(webhook.created_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-400">Updated</dt>
              <dd className="text-sm text-slate-200">{formatDate(webhook.updated_at)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Delivery History</h2>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "all" | "success" | "failed")}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {loadingDeliveries ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No deliveries yet
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className={`flex items-start gap-4 rounded-lg border p-4 ${
                  delivery.success 
                    ? "border-emerald-500/20 bg-emerald-500/5" 
                    : "border-red-500/20 bg-red-500/5"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {delivery.success ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-200">{delivery.event}</span>
                    {delivery.status_code && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        delivery.status_code >= 200 && delivery.status_code < 300
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {delivery.status_code}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      Attempt {delivery.attempts}
                    </span>
                  </div>
                  {delivery.error_message && (
                    <p className="text-sm text-red-400 mb-1">{delivery.error_message}</p>
                  )}
                  <p className="text-xs text-slate-500">{formatDate(delivery.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
