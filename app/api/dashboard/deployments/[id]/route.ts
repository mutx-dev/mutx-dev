import { NextRequest } from "next/server";

import { getApiBaseUrl } from "@/app/api/_lib/controlPlane";
import { proxyJson } from "@/app/api/_lib/proxy";
import { withErrorHandling, badRequest } from "@/app/api/_lib/errors";

const API_BASE_URL = getApiBaseUrl();

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const targetUrl =
      path === "versions"
        ? `${API_BASE_URL}/v1/deployments/${id}/versions`
        : `${API_BASE_URL}/v1/deployments/${id}`;

    return proxyJson(request, targetUrl, {
      fallbackMessage:
        path === "versions"
          ? "Failed to fetch deployment versions"
          : "Failed to fetch deployment",
    });
  })(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (!action) {
      return badRequest("Unknown action");
    }

    if (action === "restart") {
      return proxyJson(request, `${API_BASE_URL}/v1/deployments/${id}/restart`, {
        method: "POST",
        fallbackMessage: "Failed to restart deployment",
      });
    }

    if (action === "rollback" || action === "scale") {
      const body = await request.json();
      const actionPath = action === "rollback" ? "rollback" : "scale";

      return proxyJson(request, `${API_BASE_URL}/v1/deployments/${id}/${actionPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        fallbackMessage:
          action === "rollback"
            ? "Failed to rollback deployment"
            : "Failed to scale deployment",
      });
    }

    return badRequest("Unknown action");
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    return proxyJson(request, `${API_BASE_URL}/v1/deployments/${id}`, {
      method: "DELETE",
      fallbackMessage: "Failed to delete deployment",
    });
  })(request);
}
