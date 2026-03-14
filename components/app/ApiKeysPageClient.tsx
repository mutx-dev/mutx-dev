"use client";

import { useState, useEffect } from 'react';
import { KeyRound, Plus, RefreshCw, Trash2, AlertCircle, Loader2 } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  created_at: string;
  last_used: string | null;
  expires_at: string | null;
}

export function ApiKeysPageClient() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      setError(null);
      const res = await fetch('/api/api-keys');
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to fetch' }));
        throw new Error(data.detail || 'Failed to fetch API keys');
      }
      const data = await res.json();
      setKeys(Array.isArray(data) ? data : (data.keys || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    setCreatedKey(null);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to create' }));
        throw new Error(data.detail || 'Failed to create API key');
      }
      const data = await res.json();
      setCreatedKey(data.key);
      setNewKeyName('');
      fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const rotateKey = async (id: string) => {
    setRotatingId(id);
    try {
      const res = await fetch(`/api/api-keys/${id}/rotate`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to rotate' }));
        throw new Error(data.detail || 'Failed to rotate API key');
      }
      const data = await res.json();
      setCreatedKey(data.key);
      fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate API key');
    } finally {
      setRotatingId(null);
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to delete' }));
        throw new Error(data.detail || 'Failed to revoke API key');
      }
      fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {createdKey && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-300">API Key Created</p>
              <p className="mt-1 text-sm text-slate-300">Copy this key now - you won&apos;t see it again!</p>
              <code className="mt-3 block rounded-lg bg-black/30 px-3 py-2 text-sm font-mono text-amber-200 break-all">
                {createdKey}
              </code>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}
      <div className="rounded-xl border border-white/10 bg-white/[0.01] p-6">
        <h3 className="text-lg font-medium text-white mb-4">Create New API Key</h3>
        <form onSubmit={createKey} className="flex gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="e.g., Production API Key"
            className="flex-1 rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={creating || !newKeyName.trim()}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-black hover:bg-cyan-400 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create
          </button>
        </form>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.01] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-white">Your API Keys</h3>
          <p className="text-sm text-slate-400 mt-1">{keys.length} key{keys.length !== 1 ? 's' : ''}</p>
        </div>
        {keys.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <KeyRound className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-4 text-slate-400">No API keys yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {keys.map((key) => (
              <div key={key.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{key.name}</p>
                                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>Created: {formatDate(key.created_at)}</span>
                    <span>Last used: {formatDate(key.last_used)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => rotateKey(key.id)}
                    disabled={rotatingId === key.id}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 disabled:opacity-50"
                  >
                    {rotatingId === key.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Rotate
                  </button>
                  <button
                    onClick={() => deleteKey(key.id)}
                    disabled={deletingId === key.id}
                    className="flex items-center gap-1.5 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-400 hover:bg-red-400/20 disabled:opacity-50"
                  >
                    {deletingId === key.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
