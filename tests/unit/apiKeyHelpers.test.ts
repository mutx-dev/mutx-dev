import type { components } from "@/app/types/api";
import {
  getApiKeyLimit,
  getLatestActiveApiKey,
  getLatestRevokedApiKey,
} from "@/components/app/apiKeyHelpers";

type ApiKey = components["schemas"]["APIKeyResponse"];

const baseKey = (overrides: Partial<ApiKey>): ApiKey => ({
  id: "00000000-0000-0000-0000-000000000001",
  name: "base",
  last_used: null,
  created_at: "2026-03-14T09:00:00.000Z",
  expires_at: null,
  is_active: false,
  ...overrides,
});

describe("api key dashboard selectors", () => {
  it("selects the newest active key regardless to existing list order", () => {
    const keys: ApiKey[] = [
      baseKey({
        id: "older-active",
        name: "Older Active",
        created_at: "2026-03-14T09:00:00.000Z",
        is_active: true,
      }),
      baseKey({
        id: "newest-active",
        name: "Newest Active",
        created_at: "2026-03-14T11:00:00.000Z",
        is_active: true,
      }),
      baseKey({
        id: "revoked-1",
        name: "Revoked Key",
        created_at: "2026-03-14T10:00:00.000Z",
        is_active: false,
      }),
    ];

    const activeKey = getLatestActiveApiKey(keys);

    expect(activeKey).not.toBeNull();
    expect(activeKey?.id).toBe("newest-active");
    expect(activeKey?.name).toBe("Newest Active");
  });

  it("selects the newest revoked key regardless to existing list order", () => {
    const keys: ApiKey[] = [
      baseKey({
        id: "active-now",
        name: "Current",
        created_at: "2026-03-14T13:00:00.000Z",
        is_active: true,
      }),
      baseKey({
        id: "newest-revoked",
        name: "New Revoked",
        created_at: "2026-03-14T12:00:00.000Z",
        is_active: false,
      }),
      baseKey({
        id: "oldest-revoked",
        name: "Old Revoked",
        created_at: "2026-03-14T10:00:00.000Z",
        is_active: false,
      }),
    ];

    const revokedKey = getLatestRevokedApiKey(keys);

    expect(revokedKey).not.toBeNull();
    expect(revokedKey?.id).toBe("newest-revoked");
    expect(revokedKey?.name).toBe("New Revoked");
  });

  it("returns null when the requested state is absent", () => {
    const keys: ApiKey[] = [
      baseKey({
        id: "active-only",
        name: "Active Only",
        created_at: "2026-03-14T12:00:00.000Z",
        is_active: true,
      }),
    ];

    expect(getLatestRevokedApiKey(keys)).toBeNull();
    expect(getLatestActiveApiKey(keys)).not.toBeNull();
  });

  it("ignores malformed timestamps when selecting newest active key", () => {
    const keys: ApiKey[] = [
      baseKey({
        id: "good-active",
        name: "Good Active",
        created_at: "2026-03-14T12:00:00.000Z",
        is_active: true,
      }),
      baseKey({
        id: "bad-active",
        name: "Bad Active",
        created_at: "not-a-date",
        is_active: true,
      }),
      baseKey({
        id: "older-revoked",
        name: "Older Revoked",
        created_at: null,
        is_active: false,
      }),
    ];

    const activeKey = getLatestActiveApiKey(keys);

    expect(activeKey).not.toBeNull();
    expect(activeKey?.id).toBe("good-active");
  });

  it("ignores malformed timestamps when selecting newest revoked key", () => {
    const keys: ApiKey[] = [
      baseKey({
        id: "active-stable",
        name: "Active Stable",
        created_at: "2026-03-14T13:00:00.000Z",
        is_active: true,
      }),
      baseKey({
        id: "bad-revoked",
        name: "Bad Revoked",
        created_at: "not-a-date",
        is_active: false,
      }),
      baseKey({
        id: "good-revoked",
        name: "Good Revoked",
        created_at: "2026-03-14T12:00:00.000Z",
        is_active: false,
      }),
    ];

    const revokedKey = getLatestRevokedApiKey(keys);

    expect(revokedKey).not.toBeNull();
    expect(revokedKey?.id).toBe("good-revoked");
  });

  it("maps plan quotas to API key limits", () => {
    expect(getApiKeyLimit("free")).toBe(2);
    expect(getApiKeyLimit("starter")).toBe(10);
    expect(getApiKeyLimit("pro")).toBe(50);
    expect(getApiKeyLimit("enterprise")).toBeNull();
  });

  it("keeps unknown plans on a safe starter-style limit", () => {
    expect(getApiKeyLimit("mystery-tier")).toBe(10);
  });
});
