import { NextRequest } from "next/server";

import { getApiBaseUrl } from "@/app/api/_lib/controlPlane";
import { proxyJson } from "@/app/api/_lib/proxy";
import { withErrorHandling } from "@/app/api/_lib/errors";

const API_BASE_URL = getApiBaseUrl();

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ swarmId: string }> },
) {
  return withErrorHandling(async () => {
    const { swarmId } = await params;
    return proxyJson(request, `${API_BASE_URL}/v1/swarms/${swarmId}`, {
      method: "GET",
      fallbackMessage: "Failed to fetch swarm",
    });
  })(request);
}
