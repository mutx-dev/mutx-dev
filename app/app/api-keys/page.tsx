"use client";

import { KeyRound } from 'lucide-react';
import { ApiKeysPageClient } from '@/components/app/ApiKeysPageClient';

export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
          <KeyRound className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">API Keys</h1>
          <p className="mt-1 text-sm text-slate-400">
            Generate, rotate, and revoke API keys
          </p>
        </div>
      </div>
      <ApiKeysPageClient />
    </div>
  );
}
