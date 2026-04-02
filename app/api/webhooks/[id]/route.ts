import { NextRequest } from "next/server";

import { getApiBaseUrl } from "@/app/api/_lib/controlPlane";
import { proxyJson } from "@/app/api/_lib/proxy";
import { validateRequest, schemas } from "@/app/api/_lib/validation";
import { withErrorHandling } from "@/app/api/_lib/errors";


export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async (_req: Request) => {
    const { id } = await params;
    const validation = await validateRequest(schemas.webhookUpdate, request);
    if (!validation.success) {
      return validation.response;
    }

    return proxyJson(request, `${getApiBaseUrl()}/v1/webhooks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validation.data),
      fallbackMessage: "Failed to update webhook",
    });
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    return proxyJson(request, `${getApiBaseUrl()}/v1/webhooks/${id}`, {
      method: "DELETE",
      fallbackMessage: "Failed to delete webhook",
    });
  })(request);
}
