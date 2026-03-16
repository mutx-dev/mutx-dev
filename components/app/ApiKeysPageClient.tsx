"use client";

import { useState, useEffect, useRef } from 'react';
import { KeyRound, Search, Plus, RefreshCw, Trash2, AlertCircle, Loader2, Copy, Check } from 'lucide-react';

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
  const [newKeyExpires, setNewKeyExpires] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMac, setIsMac] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchKeys = async () => {
    try {
      setError(null);
      const res = await fetch('/api/api-keys');
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to fetch' }));
        throw new Error(data.detail || 'Failed to fetch API keys');
      }
      const data = await res.json();
      setKeys(Array.isArray(data) ? data : (data.items || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  // Filter keys based on search query
  const filteredKeys = keys.filter(key =>
    key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    key.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Keyboard shortcut: Cmd/Ctrl + K to focus search, Escape to clear
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    // Detect Mac OS
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
    return () => document.removeEventListener('keydown', handleKeyDown);
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
        body: JSON.stringify({ name: newKeyName.trim(), expires_in_days: newKeyExpires }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to create' }));
        throw new Error(data.detail || 'Failed to create API key');
      }
      const data = await res.json();
      setCreatedKey(data.key);
      setNewKeyName('');
      setNewKeyExpires(null);
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

  const handleCopyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyToClipboard = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <button
                onClick={copyToClipboard}
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-amber-200 hover:bg-white/20"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy to clipboard'}
              </button>
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
          <select
            value={newKeyExpires ?? ''}
            onChange={(e) => setNewKeyExpires(e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white"
          >
            <option value="">Never</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
            <option value="180">6 months</option>
            <option value="365">1 year</option>
          </select>
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
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isMac ? "Search keys by name or ID... (⌘K)" : "Search keys by name or ID... (Ctrl+K)"}
              className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
            />
          </div>
          <p className="text-sm text-slate-400 mt-3">{filteredKeys.length} of {keys.length} keys</p>
        </div>
        {keys.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <KeyRound className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-4 text-slate-400">No API keys yet</p>
          </div>
        ) : filteredKeys.length === 0 && searchQuery ? (
          <div className="px-6 py-12 text-center">
            <Search className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-4 text-slate-400">No keys match your search</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredKeys.map((key) => (
              <div key={key.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{key.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs text-slate-500 font-mono">{key.id}</code>
                    <button
                      onClick={() => handleCopyId(key.id)}
                      className="flex items-center gap-1 rounded p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                      title="Copy API key ID"
                    >
                      {copiedId === key.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>Created: {formatDate(key.created_at)}</span>
                    <span>Expires: {formatDate(key.expires_at)}</span>
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
