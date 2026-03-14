import { type components } from "@/app/types/api";

type ApiKey = components["schemas"]["APIKeyResponse"];

function createdAtToTime(value: string | undefined | null) {
  const time = new Date(value ?? "").getTime();

  return Number.isNaN(time) ? 0 : time;
}

function sortByCreatedAtDesc(apiKeys: ApiKey[]) {
  return [...apiKeys].sort(
    (left, right) => createdAtToTime(right.created_at) - createdAtToTime(left.created_at),
  );
}

const API_KEY_LIMIT_BY_PLAN: Record<string, number | null> = {
  free: 2,
  starter: 10,
  pro: 50,
  enterprise: null,
};

export function getApiKeyLimit(plan?: string | null): number | null {
  const normalizedPlan = (plan ?? "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(API_KEY_LIMIT_BY_PLAN, normalizedPlan)
    ? API_KEY_LIMIT_BY_PLAN[normalizedPlan]
    : 10;
}

export function getLatestActiveApiKey(apiKeys: ApiKey[]) {
  return sortByCreatedAtDesc(apiKeys).find((apiKey) => apiKey.is_active) ?? null;
}

export function getLatestRevokedApiKey(apiKeys: ApiKey[]) {
  return sortByCreatedAtDesc(apiKeys).find((apiKey) => !apiKey.is_active) ?? null;
}
