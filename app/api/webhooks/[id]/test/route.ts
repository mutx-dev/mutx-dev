import { NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl } from "@/app/api/_lib/controlPlane";
import { proxyJson } from "@/app/api/_lib/proxy";
import { withErrorHandling } from "@/app/api/_lib/errors";


export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    return proxyJson(request, `${getApiBaseUrl()}/v1/webhooks/${id}/test`, {
      method: "POST",
      fallbackMessage: "Failed to test webhook",
    });
  })(request);
}
