import { NextRequest } from "next/server";

import { getApiBaseUrl } from "@/app/api/_lib/controlPlane";
import { withErrorHandling } from "@/app/api/_lib/errors";
import { proxyJson } from "@/app/api/_lib/proxy";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  return withErrorHandling(async () => {
    const { templateId } = await params;
    return proxyJson(request, `${getApiBaseUrl()}/v1/templates/custom/${templateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      fallbackMessage: "Failed to update custom template",
    });
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  return withErrorHandling(async () => {
    const { templateId } = await params;
    return proxyJson(request, `${getApiBaseUrl()}/v1/templates/custom/${templateId}`, {
      method: "DELETE",
      fallbackMessage: "Failed to delete custom template",
    });
  })(request);
}
