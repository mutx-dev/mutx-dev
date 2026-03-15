"use client";

import { ErrorBoundary } from '@/components/app/ErrorBoundary';
import { DeploymentsPageClient } from '@/components/app/DeploymentsPageClient';

export default function DeploymentsPage() {
  return (
    <ErrorBoundary>
      <DeploymentsPageClient />
    </ErrorBoundary>
  );
}
