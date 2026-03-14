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

export function getLatestActiveApiKey(apiKeys: ApiKey[]) {
  return sortByCreatedAtDesc(apiKeys).find((apiKey) => apiKey.is_active) ?? null;
}

export function getLatestRevokedApiKey(apiKeys: ApiKey[]) {
  return sortByCreatedAtDesc(apiKeys).find((apiKey) => !apiKey.is_active) ?? null;
}
