import { NextRequest } from "next/server";

import { getApiBaseUrl } from "@/app/api/_lib/controlPlane";
import { withErrorHandling } from "@/app/api/_lib/errors";
import { proxyJson } from "@/app/api/_lib/proxy";

const API_BASE_URL = getApiBaseUrl();

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> },
) {
  return withErrorHandling(async () => {
    const { agentId } = await context.params;
    return proxyJson(
      request,
      `${API_BASE_URL}/v1/assistant/${agentId}/health`,
      { fallbackMessage: "Failed to fetch assistant health" },
    );
  })(request);
}
