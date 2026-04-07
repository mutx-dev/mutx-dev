import { NextRequest } from "next/server";

import { getApiBaseUrl } from "@/app/api/_lib/controlPlane";
import { withErrorHandling } from "@/app/api/_lib/errors";
import { proxyJson } from "@/app/api/_lib/proxy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    return proxyJson(request, `${getApiBaseUrl()}/v1/templates/custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      fallbackMessage: "Failed to create custom template",
    });
  })(request);
}
