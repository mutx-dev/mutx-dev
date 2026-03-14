import type { components } from "@/app/types/api";
import {
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
        id: "oldest-revoked",
        name: "Old Revoked",
        created_at: "2026-03-14T10:00:00.000Z",
        is_active: false,
      }),
      baseKey({
        id: "newest-revoked",
        name: "New Revoked",
        created_at: "2026-03-14T12:00:00.000Z",
        is_active: false,
      }),
      baseKey({
        id: "active-now",
        name: "Current",
        created_at: "2026-03-14T11:00:00.000Z",
        is_active: true,
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
});
